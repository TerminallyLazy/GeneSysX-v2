import { useState, lazy, Suspense } from 'react';
import { Search, Box, Microscope } from 'lucide-react';
import { fetchUniProtByAccession } from '../services/uniprot';

export default function ProteinAnalysis() {
  const [sequence, setSequence] = useState('');
  const [analysisType, setAnalysisType] = useState('structure');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uniprot, setUniprot] = useState<null | {
    accession: string;
    name?: string;
    organism?: string;
    length?: number;
  }>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Protein Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Protein Sequence
            </label>
            <textarea
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              className="w-full h-48 rounded-lg border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter protein sequence in FASTA format..."
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Analysis Type
              </label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="form-select"
              >
                <option value="structure">Structure Prediction</option>
                <option value="domains">Domain Analysis</option>
                <option value="motifs">Motif Search</option>
                <option value="properties">Physicochemical Properties</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                className="btn-primary disabled:opacity-50"
                disabled={loading}
                onClick={async () => {
                  setError(null);
                  setUniprot(null);
                  try {
                    setLoading(true);
                    const accession = sequence.trim();
                    if (!accession) {
                      setError('Enter a UniProt accession (e.g., P69905)');
                    } else {
                      const e = await fetchUniProtByAccession(accession);
                      setUniprot({
                        accession: e.primaryAccession,
                        name: e.proteinDescription?.recommendedName?.fullName?.value,
                        organism: e.organism?.scientificName,
                        length: e.sequence?.length,
                      });
                    }
                  } catch (e: unknown) {
                    setError(e instanceof Error ? e.message : 'Lookup failed');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Analyzing…' : 'Analyze'}
              </button>
              <button className="btn-secondary">
                <Box className="h-4 w-4 mr-2" />
                Examples
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Protein Info</h3>
          {error && (
            <div className="mb-3 text-sm text-red-600 dark:text-red-300">{error}</div>
          )}
          {uniprot ? (
            <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
              <div><span className="font-medium">Accession:</span> {uniprot.accession}</div>
              {uniprot.name && <div><span className="font-medium">Name:</span> {uniprot.name}</div>}
              {uniprot.organism && <div><span className="font-medium">Organism:</span> {uniprot.organism}</div>}
              {uniprot.length && <div><span className="font-medium">Length:</span> {uniprot.length} aa</div>}
              <div className="pt-2">
                <a
                  className="text-indigo-600 dark:text-indigo-400 underline"
                  href={`https://www.uniprot.org/uniprotkb/${uniprot.accession}`}
                  target="_blank"
                  rel="noreferrer"
                >Open in UniProt</a>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">Enter a UniProt accession (e.g., P69905) and click Analyze.</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Structure</h3>
          <div className="h-64 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center p-3 w-full">
            {uniprot ? (
              <div className="w-full">
                <div className="text-xs mb-2">
                  <a
                    className="text-indigo-600 dark:text-indigo-400 underline"
                    href={`https://alphafold.ebi.ac.uk/entry/${uniprot.accession}`}
                    target="_blank"
                    rel="noreferrer"
                  >Open in AlphaFold</a>
                </div>
                {/* Inline 3D viewer */}
                {typeof window !== 'undefined' && (
                  <Suspense fallback={<div className="text-sm text-slate-500">Loading viewer…</div>}>
                    {(() => {
                      const Viewer = lazy(() => import('./AlphaFold3D'));
                      return <Viewer accession={uniprot.accession} />;
                    })()}
                  </Suspense>
                )}
              </div>
            ) : (
              <Microscope className="h-12 w-12 text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}