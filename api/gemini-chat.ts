import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Server-side Gemini endpoint
// POST { message: string, history?: {role:'user'|'assistant', content:string}[], options?: {...} }
// Returns: { text }

const MODEL_NAME = 'gemini-1.5-pro-latest';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'server not configured' });

    const { message, history = [], options = {} } = (req.body || {}) as {
      message: string;
      history?: { role: 'user'|'assistant'; content: string }[];
      options?: Record<string, unknown>;
    };

    if (!message) return res.status(400).json({ error: 'message is required' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Map history to Gemini format
    const chatHistory = history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));

    const chat = model.startChat({ history: chatHistory, generationConfig: options as Record<string, unknown> });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'server error';
    return res.status(500).json({ error: message });
  }
}
