export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class ChatService {
  private history: { role: 'user' | 'assistant'; content: string }[] = [];

  async sendMessage(message: string): Promise<string> {
    try {
      // update local history and send to serverless proxy
      this.history.push({ role: 'user', content: message });

      const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: this.history,
          options: {
            maxOutputTokens: 1000,
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gemini request failed');
      const text: string = data.text || '';
      this.history.push({ role: 'assistant', content: text });
      return text;
    } catch (error) {
      console.error('Error in chat service:', error);
      throw new Error('Failed to get response from AI service');
    }
  }

  async sendMessageStream(
    message: string,
    onToken: (delta: string) => void,
    opts?: { signal?: AbortSignal }
  ): Promise<string> {
    // Accumulator for final text
    let final = '';
    const res = await fetch('/api/gemini-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: opts?.signal,
      body: JSON.stringify({
        message,
        history: this.history,
        options: {
          maxOutputTokens: 1000,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      }),
    });
    if (!res.body) throw new Error('No stream');
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      if (opts?.signal?.aborted) break;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const evt = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const lines = evt.split('\n');
        let eventName: string | null = null;
        let dataLine = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          if (line.startsWith('data:')) dataLine += line.slice(5).trim();
        }
        if (eventName === 'done') {
          const payload = JSON.parse(dataLine || '{}');
          final = payload.text || final;
          break;
        } else if (eventName === 'error') {
          const payload = JSON.parse(dataLine || '{}');
          throw new Error(payload.error || 'stream error');
        } else if (dataLine) {
          const payload = JSON.parse(dataLine);
          const t = payload.token as string;
          if (t) {
            onToken(t);
            final += t;
          }
        }
      }
    }
    // Update history
    this.history.push({ role: 'user', content: message });
    this.history.push({ role: 'assistant', content: final });
    return final;
  }

  async resetChat() {
    this.history = [];
  }
}

export const chatService = new ChatService();
