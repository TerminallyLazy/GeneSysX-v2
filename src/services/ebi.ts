export type ClustalStype = 'protein' | 'dna' | 'rna';

export interface ClustalRunParams {
  sequence: string; // multi-FASTA text
  stype: ClustalStype;
  email?: string; // recommended by EBI
  guid?: string;
}

const BASE = 'https://www.ebi.ac.uk/Tools/services/rest/clustalo';

export function detectStypeFromFasta(fasta: string): ClustalStype {
  const seq = fasta
    .split('\n')
    .filter(l => !l.startsWith('>'))
    .join('')
    .toUpperCase()
    .replace(/\s/g, '');
  // If contains U (uracil) and not T, assume RNA
  if (/U/.test(seq) && !/T/.test(seq)) return 'rna';
  // Heuristic: if only DNA alphabet, it's dna else protein
  if (/^[ACGTN-]+$/.test(seq)) return 'dna';
  return 'protein';
}

export async function clustalRun(params: ClustalRunParams): Promise<string> {
  const body = new URLSearchParams({
    sequence: params.sequence,
    stype: params.stype,
    email: params.email || 'genesysx@local',
    guid: params.guid || 'genesysx-client',
  });

  const res = await fetch(`${BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Clustal run failed: ${res.status}`);
  const jobId = (await res.text()).trim();
  return jobId;
}

export async function clustalStatus(jobId: string): Promise<'RUNNING'|'FINISHED'|'NOT_FOUND'|'ERROR'> {
  const res = await fetch(`${BASE}/status/${encodeURIComponent(jobId)}`);
  if (!res.ok) throw new Error(`Status failed: ${res.status}`);
  const s = (await res.text()).trim().toUpperCase();
  const allowed = ['RUNNING','FINISHED','NOT_FOUND','ERROR'] as const;
  if ((allowed as readonly string[]).includes(s)) return s as typeof allowed[number];
  return 'ERROR';
}

export type ClustalResultType =
  | 'aln-clustal'
  | 'aln-fasta'
  | 'aln-pir'
  | 'aln-phy'
  | 'tree'
  | 'dnd';

export async function clustalResult(jobId: string, type: ClustalResultType = 'aln-clustal'): Promise<string> {
  const res = await fetch(`${BASE}/result/${encodeURIComponent(jobId)}/${type}`);
  if (!res.ok) throw new Error(`Result failed: ${res.status}`);
  return await res.text();
}
