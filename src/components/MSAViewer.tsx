import { useMemo } from 'react';

export interface MSAEntry {
  id: string;
  seq: string; // aligned sequence with gaps '-'
}

export interface MSAData {
  entries: MSAEntry[];
  length: number;
  isDNA: boolean;
  conservation: number[]; // 0..1 per column
}

function detectIsDNA(allSeq: string): boolean {
  const chars = allSeq.replace(/\s|-/g, '').toUpperCase();
  return /^[ACGTUN]*$/.test(chars);
}

function computeConservation(columns: string[]): number[] {
  return columns.map(col => {
    const filtered = col.replace(/-/g, '');
    if (!filtered.length) return 0;
    const counts: Record<string, number> = {};
    for (const c of filtered) counts[c] = (counts[c] || 0) + 1;
    const max = Math.max(...Object.values(counts));
    return max / filtered.length;
  });
}

export function parseClustal(clustalText: string): MSAData | null {
  // Combine blocks
  const lines = clustalText.split(/\r?\n/);
  const map: Record<string, string[]> = {};
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    if (/^CLUSTAL/i.test(line)) continue;
    // consensus line (starts with spaces) -> skip
    if (/^\s*[*:.]/.test(raw)) continue;
    const m = raw.match(/^(\S+)\s+([A-Za-z\-.]+)/);
    if (!m) continue;
    const id = m[1];
    const chunk = m[2].replace(/\./g, '-');
    map[id] = map[id] || [];
    map[id].push(chunk);
  }
  const entries: MSAEntry[] = Object.entries(map).map(([id, chunks]) => ({ id, seq: chunks.join('') }));
  if (!entries.length) return null;
  const length = entries[0].seq.length;
  const allSeq = entries.map(e => e.seq).join('');
  const isDNA = detectIsDNA(allSeq);
  // Build columns
  const columns: string[] = Array.from({ length }, (_, i) => entries.map(e => e.seq[i] || '-').join(''));
  const conservation = computeConservation(columns);
  return { entries, length, isDNA, conservation };
}

const dnaColor: Record<string, string> = {
  A: 'text-green-500 dark:text-green-400',
  C: 'text-blue-500 dark:text-blue-400',
  G: 'text-yellow-500 dark:text-yellow-400',
  T: 'text-red-500 dark:text-red-400',
  U: 'text-red-500 dark:text-red-400',
  N: 'text-gray-500 dark:text-gray-400',
};

const proteinColor: Record<string, string> = {
  A: 'text-orange-500 dark:text-orange-400', V: 'text-orange-500 dark:text-orange-400', L: 'text-orange-500 dark:text-orange-400', I: 'text-orange-500 dark:text-orange-400',
  M: 'text-orange-500 dark:text-orange-400', F: 'text-orange-500 dark:text-orange-400', W: 'text-orange-500 dark:text-orange-400', P: 'text-orange-500 dark:text-orange-400',
  S: 'text-green-500 dark:text-green-400', T: 'text-green-500 dark:text-green-400', Y: 'text-green-500 dark:text-green-400', N: 'text-green-500 dark:text-green-400',
  Q: 'text-green-500 dark:text-green-400', C: 'text-green-500 dark:text-green-400',
  K: 'text-blue-500 dark:text-blue-400', R: 'text-blue-500 dark:text-blue-400', H: 'text-blue-500 dark:text-blue-400',
  D: 'text-red-500 dark:text-red-400', E: 'text-red-500 dark:text-red-400',
  G: 'text-purple-500 dark:text-purple-400',
  X: 'text-gray-500 dark:text-gray-400', '*': 'text-gray-500 dark:text-gray-400', '-': 'text-gray-400 dark:text-gray-500',
};

function charClass(isDNA: boolean, ch: string): string {
  if (ch === '-') return 'text-gray-400 dark:text-gray-500';
  const up = ch.toUpperCase();
  return (isDNA ? dnaColor[up] : proteinColor[up]) || 'text-gray-500 dark:text-gray-400';
}

export default function MSAViewer({ clustal, width = 60, showConservation = true, showConsensus = false }: { clustal: string; width?: number; showConservation?: boolean; showConsensus?: boolean }) {
  const data = useMemo(() => parseClustal(clustal), [clustal]);

  // Build consensus string (most frequent non-gap per column)
  const consensus = useMemo(() => {
    if (!data) return '';
    const { entries, length } = data;
    const cols: string[] = Array.from({ length }, (_, i) => entries.map(e => e.seq[i] || '-').join(''));
    return cols.map(col => {
      const counts: Record<string, number> = {};
      for (const c of col) {
        if (c === '-') continue;
        counts[c] = (counts[c] || 0) + 1;
      }
      let best = '';
      let bestN = 0;
      for (const [k, v] of Object.entries(counts)) {
        if (v > bestN) { best = k; bestN = v; }
      }
      return best || '·';
    }).join('');
  }, [data]);

  if (!data) return <div className="text-sm text-slate-500">Unable to parse alignment.</div>;
  const { entries, length, isDNA, conservation } = data;

  const rows = Math.ceil(length / width);

  return (
    <div className="font-mono text-sm">
      {Array.from({ length: rows }, (_, r) => {
        const start = r * width;
        const end = Math.min(start + width, length);
        return (
          <div key={r} className="mb-4">
            {/* Conservation bar */}
            {showConservation && (
              <div className="flex gap-1 mb-1">
                {conservation.slice(start, end).map((c, i) => (
                  <div key={i} className="h-1 rounded" style={{ width: 6, backgroundColor: `rgba(99,102,241,${c})` }} />
                ))}
              </div>
            )}
            {/* Consensus */}
            {showConsensus && (
              <div className="flex mb-1">
                <span className="w-24 pr-2 text-right text-slate-500 dark:text-slate-400 truncate">consensus</span>
                <div className="text-slate-600 dark:text-slate-300">
                  {consensus.slice(start, end)}
                </div>
              </div>
            )}
            {/* Sequences */}
            {entries.map(e => (
              <div key={e.id} className="flex">
                <span className="w-24 pr-2 text-right text-slate-500 dark:text-slate-400 truncate">{e.id}</span>
                <div>
                  {e.seq.slice(start, end).split('').map((ch, i) => (
                    <span key={i} className={`${charClass(isDNA, ch)}`}>{ch}</span>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-xs text-slate-400 mt-1">{start + 1} – {end}</div>
          </div>
        );
      })}
    </div>
  );
}
