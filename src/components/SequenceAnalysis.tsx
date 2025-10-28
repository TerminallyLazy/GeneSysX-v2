import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import SequenceInput from './sequence/SequenceInput';
import AnalysisResult from './sequence/AnalysisResult';
import AlignmentResultView from './sequence/AlignmentResult';
import { analyzeSequence } from './sequence/analyzeSequence';
import { smithWaterman } from './sequence/smithWaterman';
import { needlemanWunsch } from './sequence/needlemanWunsch';
import type { AlignmentResult, AlignmentAlgorithm } from './sequence/types';

export default function SequenceAnalysis() {
  const [sequence1, setSequence1] = useState('');
  const [sequence2, setSequence2] = useState('');
  const [algorithm, setAlgorithm] = useState<AlignmentAlgorithm>('smith-waterman');
  const [basicResult, setBasicResult] = useState<string | null>(null);
  const [alignmentResult, setAlignmentResult] = useState<AlignmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDarkMode = document.documentElement.classList.contains('dark');

  // BLAST state
  const [blastProgram, setBlastProgram] = useState<'blastn'|'blastp'>('blastn');
  const [blastDatabase, setBlastDatabase] = useState<'nt'|'nr'>('nt');
  const [blastRid, setBlastRid] = useState<string | null>(null);
  const [blastStatus, setBlastStatus] = useState<string>('IDLE');
  const [blastResult, setBlastResult] = useState<string>('');
  const [blastError, setBlastError] = useState<string | null>(null);
  const [blastFormat, setBlastFormat] = useState<'text'|'xml'|'json'>('text');
  const blastEsRef = useRef<EventSource | null>(null);

  const handleBasicAnalysis = () => {
    if (!sequence1) return;
    const analysis = analyzeSequence(sequence1);
    setBasicResult(analysis);
  };

  const handleAlignment = async () => {
    setLoading(true);
    setError(null);
    setAlignmentResult(null);

    if (!sequence1 || !sequence2) {
      setError("Please enter both sequences");
      setLoading(false);
      return;
    }

    try {
      const alignmentFunction = algorithm === 'smith-waterman' ? smithWaterman : needlemanWunsch;
      const result = alignmentFunction(sequence1.toUpperCase(), sequence2.toUpperCase());
      setAlignmentResult(result);
    } catch (error) {
      console.error("Alignment error:", error);
      setError("An error occurred during sequence alignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sequence Analysis</h2>
        
        <div className="space-y-6">
          <div>
            <SequenceInput 
              sequence={sequence1}
              onChange={setSequence1}
              label="First Sequence"
            />
          </div>
          
          <div>
            <SequenceInput 
              sequence={sequence2}
              onChange={setSequence2}
              label="Second Sequence (for alignment)"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alignment Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as AlignmentAlgorithm)}
                className="form-select w-full"
              >
                <option value="smith-waterman">Smith-Waterman (Local Alignment)</option>
                <option value="needleman-wunsch">Needleman-Wunsch (Global Alignment)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleBasicAnalysis}
                className="flex-1 sm:flex-none inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:ring-offset-gray-900"
              >
                Basic Analysis
              </button>
              
              <button
                onClick={handleAlignment}
                disabled={loading}
                className="flex-1 sm:flex-none inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:ring-offset-gray-900 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aligning...
                  </>
                ) : (
                  "Align Sequences"
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {basicResult && <AnalysisResult result={basicResult} />}
          
          {alignmentResult && (
            <AlignmentResultView 
              result={alignmentResult}
              isDarkMode={isDarkMode}
              algorithm={algorithm}
            />
          )}
        </div>
      </div>

      {/* NCBI BLAST */}
      <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">NCBI BLAST</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Program</label>
            <select className="form-select w-full" value={blastProgram} onChange={e=>setBlastProgram(e.target.value as 'blastn'|'blastp')}>
              <option value="blastn">blastn (DNA vs nt)</option>
              <option value="blastp">blastp (Protein vs nr)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Database</label>
            <select className="form-select w-full" value={blastDatabase} onChange={e=>setBlastDatabase(e.target.value as 'nt'|'nr')}>
              <option value="nt">nt</option>
              <option value="nr">nr</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format</label>
            <select className="form-select w-full" value={blastFormat} onChange={e=>setBlastFormat(e.target.value as 'text'|'xml'|'json')}>
              <option value="text">Text</option>
              <option value="xml">XML</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="btn-primary mr-2 disabled:opacity-50"
              disabled={blastStatus === 'RUNNING' || blastStatus === 'SUBMITTING'}
              onClick={async () => {
                setBlastError(null);
                setBlastResult('');
                setBlastRid(null);
                try {
                  if (!sequence1.trim()) { setBlastError('Enter a sequence in the first box'); return; }
                  setBlastStatus('SUBMITTING');
                  const res = await fetch('/api/blast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ program: blastProgram, database: blastDatabase, sequence: sequence1 })
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || 'Submit failed');
                  setBlastRid(data.rid);
                  setBlastStatus('RUNNING');

                  // Prefer SSE status stream if available
                  await new Promise<void>((resolve, reject) => {
                    try {
                      const es = new EventSource(`/api/blast-status-stream?rid=${encodeURIComponent(data.rid)}`);
                      blastEsRef.current = es;
                      es.onmessage = (ev) => {
                        try {
                          const payload = JSON.parse(ev.data || '{}');
                          if (payload.status) setBlastStatus(payload.status);
                        } catch {
                          // ignore parse errors
                        }
                      };
                      es.addEventListener('done', async () => {
                        es.close();
                        blastEsRef.current = null;
                        resolve();
                      });
                      es.addEventListener('error', () => {
                        es.close();
                        blastEsRef.current = null;
                        reject(new Error('BLAST stream error'));
                      });
                    } catch (e) {
                      reject(e as Error);
                    }
                  });

                  const rres = await fetch(`/api/blast?action=result&rid=${encodeURIComponent(data.rid)}&format=${blastFormat}`);
                  const raw = await rres.text();
                  if (!rres.ok) throw new Error('Result failed');
                  setBlastResult(blastFormat === 'json' ? JSON.stringify(JSON.parse(raw), null, 2) : raw);
                  setBlastStatus('FINISHED');
                } catch (e: unknown) {
                  setBlastError(e instanceof Error ? e.message : 'BLAST error');
                  setBlastStatus('ERROR');
                }
              }}
>Run BLAST</button>
            {blastStatus === 'RUNNING' && (
              <button
                className="btn-secondary"
                onClick={() => {
                  try { blastEsRef.current?.close(); } catch {/* ignore */}
                  blastEsRef.current = null;
                  setBlastStatus('CANCELLED');
                }}
              >Cancel</button>
            )}
          </div>
        </div>
        {blastError && <div className="mt-3 text-sm text-red-600 dark:text-red-300">{blastError}</div>}
        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              Status: {blastStatus} {blastRid ? `(RID: ${blastRid})` : ''}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary"
                onClick={async () => {
                  if (!blastResult) return;
                  try { await navigator.clipboard.writeText(blastResult); } catch { /* ignore */ }
                }}
              >Copy</button>
              <button
                className="btn-secondary"
                onClick={() => {
                  const ext = blastFormat === 'json' ? 'json' : (blastFormat === 'xml' ? 'xml' : 'txt');
                  const blob = new Blob([blastResult], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `blast_result.${ext}`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >Download</button>
              <button
                className="btn-secondary"
                onClick={() => { setBlastResult(''); setBlastRid(null); setBlastStatus('IDLE'); }}
              >Clear</button>
            </div>
          </div>
          <pre className="p-3 text-xs overflow-auto max-h-96 whitespace-pre-wrap text-gray-800 dark:text-gray-100">{blastResult || 'Results will appear here'}</pre>
        </div>
      </div>
    </div>
  );
}
