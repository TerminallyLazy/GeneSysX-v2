import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless function for NCBI BLAST (QBLAST) proxy
// POST: submit job → { rid, rtoe }
// GET ?action=status&rid=... → { status, thereAreHits }
// GET ?action=result&rid=...&format=text|xml|json → returns text/xml/json

const BLAST_URL = 'https://blast.ncbi.nlm.nih.gov/Blast.cgi';

interface BlastSubmitBody {
  program: string;
  database: string;
  sequence: string;
  entrez_query?: string;
  expect?: number;
  hitlist_size?: number;
}

async function submitBlast(body: unknown) {
  const { program, database, sequence, entrez_query, expect, hitlist_size } = (body || {}) as BlastSubmitBody;
  if (!program || !database || !sequence) {
    return { status: 400, data: { error: 'program, database, and sequence are required' } };
  }

  const form = new URLSearchParams();
  form.set('CMD', 'Put');
  form.set('PROGRAM', program);
  form.set('DATABASE', database);
  form.set('QUERY', sequence);
  if (entrez_query) form.set('ENTREZ_QUERY', entrez_query);
  if (expect) form.set('EXPECT', String(expect));
  if (hitlist_size) form.set('HITLIST_SIZE', String(hitlist_size));

  const res = await fetch(BLAST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    return { status: res.status, data: { error: `BLAST submit failed`, detail: text } };
  }
  const ridMatch = text.match(/RID\s*=\s*([A-Z0-9-]+)/i);
  const rtoeMatch = text.match(/RTOE\s*=\s*(\d+)/i);
  if (!ridMatch) {
    return { status: 500, data: { error: 'RID not returned', detail: text } };
  }
  return { status: 200, data: { rid: ridMatch[1], rtoe: rtoeMatch ? Number(rtoeMatch[1]) : undefined } };
}

async function getStatus(rid: string) {
  const url = `${BLAST_URL}?CMD=Get&RID=${encodeURIComponent(rid)}&FORMAT_OBJECT=SearchInfo`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) return { status: res.status, data: { error: 'Status request failed', detail: text } };
  const statusMatch = text.match(/Status=(\w+)/i);
  const hitsMatch = text.match(/ThereAreHits=(\w+)/i);
  return {
    status: 200,
    data: {
      status: statusMatch ? statusMatch[1] : 'UNKNOWN',
      thereAreHits: hitsMatch ? hitsMatch[1].toLowerCase() === 'yes' : undefined,
      raw: text,
    },
  };
}

async function getResult(rid: string, format: string) {
  const params = new URLSearchParams();
  params.set('CMD', 'Get');
  params.set('RID', rid);
  if (format === 'json') {
    params.set('FORMAT_TYPE', 'JSON2');
    params.set('FORMAT_OBJECT', 'Alignment');
  } else if (format === 'xml') {
    params.set('FORMAT_TYPE', 'XML');
  } else {
    params.set('FORMAT_TYPE', 'Text');
  }
  const url = `${BLAST_URL}?${params.toString()}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) return { status: res.status, headers: { 'content-type': 'text/plain' }, body: text };
  const headers: Record<string, string> = {
    'content-type': format === 'json' ? 'application/json' : format === 'xml' ? 'application/xml' : 'text/plain',
  };
  return { status: 200, headers, body: text };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const result = await submitBlast(req.body);
      return res.status(result.status).json(result.data);
    }
    if (req.method === 'GET') {
      const { action, rid, format = 'text' } = req.query as Record<string, string>;
      if (!rid) return res.status(400).json({ error: 'rid is required' });
      if (action === 'status') {
        const result = await getStatus(rid);
        return res.status(result.status).json(result.data);
      }
      if (action === 'result') {
        const result = await getResult(rid, format);
        res.status(result.status);
        for (const [k, v] of Object.entries(result.headers || {})) res.setHeader(k, v);
        return res.send(result.body);
      }
      return res.status(400).json({ error: 'invalid action' });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'server error';
    return res.status(500).json({ error: message });
  }
}
