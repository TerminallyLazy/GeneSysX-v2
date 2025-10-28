import { lazy, Suspense, useState } from 'react';
import { Upload, Download, Play, AlignLeft } from 'lucide-react';
import { clustalRun, clustalStatus, clustalResult, detectStypeFromFasta } from '../services/ebi';

export default function MultipleSequenceAlignment() {
  const [sequences, setSequences] = useState('');
  const [algorithm, setAlgorithm] = useState('clustalo');
  const [gapOpenPenalty, setGapOpenPenalty] = useState(-10);
  const [gapExtendPenalty, setGapExtendPenalty] = useState(-0.5);
  const [status, setStatus] = useState<'IDLE'|'RUNNING'|'FINISHED'|'ERROR'>('IDLE');
  const [alignment, setAlignment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [viewerWidth, setViewerWidth] = useState<number>(60);
  const [showConsensus, setShowConsensus] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Multiple Sequence Alignment</h2>
          <div className="flex space-x-2">
            <button className="btn-secondary">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <button className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button 
              className="btn-primary disabled:opacity-50"
              onClick={async () => {
                setError(null);
                setAlignment('');
                try {
                  if (!sequences.trim()) {
                    setError('Please provide sequences in FASTA format');
                    return;
                  }
                  setStatus('RUNNING');
                  const stype = detectStypeFromFasta(sequences);
                  const jid = await clustalRun({ sequence: sequences, stype });
                  // poll
                  let pollCount = 0;
                  while (true) {
                    await new Promise(r => setTimeout(r, 2000));
                    const s = await clustalStatus(jid);
                    if (s === 'FINISHED') break;
                    if (s === 'ERROR' || s === 'NOT_FOUND') throw new Error(`Job ${s}`);
                    if (pollCount++ > 60) throw new Error('Timeout waiting for alignment');
                  }
                  const result = await clustalResult(jid, 'aln-clustal');
                  setAlignment(result);
                  setStatus('FINISHED');
                } catch (e: unknown) {
                  console.error(e);
                  setError(e instanceof Error ? e.message : 'Alignment failed');
                  setStatus('ERROR');
                }
              }}
              disabled={status === 'RUNNING'}
            >
              <Play className="h-4 w-4 mr-2" />
              {status === 'RUNNING' ? 'Aligning…' : 'Align'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Input Sequences (FASTA format)
            </label>
            <textarea
              value={sequences}
              onChange={(e) => setSequences(e.target.value)}
              className="w-full h-64 rounded-lg border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder=">Sequence1&#10;ATGCTAGCTAGCT&#10;>Sequence2&#10;ATGCTAGCTAGCT"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="form-select"
              >
                <option value="clustalw">ClustalW</option>
                <option value="muscle">MUSCLE</option>
                <option value="mafft">MAFFT</option>
                <option value="kalign">Kalign</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gap Open Penalty
              </label>
              <input
                type="number"
                value={gapOpenPenalty}
                onChange={(e) => setGapOpenPenalty(Number(e.target.value))}
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gap Extension Penalty
              </label>
              <input
                type="number"
                value={gapExtendPenalty}
                onChange={(e) => setGapExtendPenalty(Number(e.target.value))}
                step="0.1"
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <AlignLeft className="h-5 w-5 mr-2" />
          Alignment Viewer
        </h3>
        {error && (
          <div className="mb-3 text-sm text-red-600 dark:text-red-300">{error}</div>
        )}
        <div className="h-96 border border-gray-200 dark:border-gray-600 rounded-lg overflow-auto font-mono bg-white dark:bg-gray-900">
          {alignment ? (
            <div className="p-2 min-w-[600px]">
              {/* Controls */}
              <div className="flex items-center gap-3 mb-2 text-xs">
                <label className="flex items-center gap-1">
                  <span>Width</span>
                  <select
                    value={viewerWidth}
                    onChange={(e) => setViewerWidth(Number(e.target.value))}
                    className="form-select py-0 px-1"
                  >
                    <option value={50}>50</option>
                    <option value={60}>60</option>
                    <option value={80}>80</option>
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={showConsensus} onChange={e=>setShowConsensus(e.target.checked)} />
                  <span>Consensus</span>
                </label>
              </div>
              {/* Lazy-load MSA viewer to keep initial bundle light */}
              <Suspense fallback={<pre className="p-4 text-sm whitespace-pre">{alignment}</pre>}>
                {(() => {
                  const MSAViewer = lazy(() => import('./MSAViewer'));
                  return <MSAViewer clustal={alignment} width={viewerWidth} showConservation={true} showConsensus={showConsensus} />;
                })()}
              </Suspense>
            </div>
          ) : (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Alignment results will appear here</div>
          )}
        </div>
        {alignment && (
          <div className="mt-3 flex gap-2">
            <button
              className="btn-secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(alignment);
              }}
            >Copy</button>
            <button
              className="btn-secondary"
              onClick={() => {
                const blob = new Blob([alignment], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'alignment.clustal.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >Download</button>
          </div>
        )}
      </div>
    </div>
  );
}