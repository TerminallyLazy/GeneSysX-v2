import type { VercelRequest, VercelResponse } from '@vercel/node';

const BLAST_URL = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const rid = (req.query.rid as string) || '';
  if (!rid) {
    res.status(400).json({ error: 'rid is required' });
    return;
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    let tries = 0;
    // Initial ping
    res.write(`data: ${JSON.stringify({ status: 'START' })}\n\n`);
    while (true) {
      await new Promise(r => setTimeout(r, 2000));
      const url = `${BLAST_URL}?CMD=Get&RID=${encodeURIComponent(rid)}&FORMAT_OBJECT=SearchInfo`;
      const sres = await fetch(url);
      const text = await sres.text();
      const statusMatch = text.match(/Status=(\w+)/i);
      const status = statusMatch ? statusMatch[1] : 'UNKNOWN';
      res.write(`data: ${JSON.stringify({ status })}\n\n`);
      if (status === 'READY') {
        res.write(`event: done\n`);
        res.write(`data: ${JSON.stringify({ status })}\n\n`);
        break;
      }
      if (status === 'FAILED' || status === 'UNKNOWN' || tries++ > 60) {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ error: `Status ${status}` })}\n\n`);
        break;
      }
    }
    } catch (e) {
    const message = e instanceof Error ? e.message : 'server error';
    try {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } catch {
      // ignore write failures
    }
  } finally {
    res.end();
  }
}
