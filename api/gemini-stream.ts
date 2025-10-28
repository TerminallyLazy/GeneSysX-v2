import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// SSE streaming endpoint for Gemini chat
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'server not configured' });
    return;
  }

  try {
    const { message, history = [], options = {} } = (req.body || {}) as {
      message: string;
      history?: { role: 'user'|'assistant'; content: string }[];
      options?: Record<string, unknown>;
    };
    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    const chatHistory = history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
    const chat = model.startChat({ history: chatHistory, generationConfig: options as Record<string, unknown> });

    const result = await (chat as unknown as { sendMessageStream: (m: string) => Promise<{ stream: AsyncIterable<unknown>; response: unknown }> }).sendMessageStream(message);
    let full = '';
    for await (const chunk of result.stream) {
      const t = (chunk as { text?: () => string })?.text?.() ?? '';
      if (t) {
        full += t;
        res.write(`data: ${JSON.stringify({ token: t })}\n\n`);
      }
    }
    const response = result.response as { text?: () => string };
    const finalText = response?.text?.() ?? full;
    res.write(`event: done\n`);
    res.write(`data: ${JSON.stringify({ text: finalText })}\n\n`);
    res.end();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'server error';
    // Send as SSE error
    try {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } catch {
      // ignore write failures
    }
    res.end();
  }
}
