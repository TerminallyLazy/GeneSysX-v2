import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function SequenceAnalyzer() {
  const [sequence, setSequence] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const analyzeSequence = () => {
    if (!sequence) return;

    const gc = sequence.toUpperCase().split('').reduce((count, base) => {
      return count + (base === 'G' || base === 'C' ? 1 : 0);
    }, 0);

    const gcContent = ((gc / sequence.length) * 100).toFixed(2);
    const length = sequence.length;
    const analysis = `
Sequence Length: ${length.toLocaleString()} bp
GC Content: ${gcContent}%
Base Composition:
A: ${((sequence.toUpperCase().match(/A/g) || []).length / length * 100).toFixed(2)}%
T: ${((sequence.toUpperCase().match(/T/g) || []).length / length * 100).toFixed(2)}%
G: ${((sequence.toUpperCase().match(/G/g) || []).length / length * 100).toFixed(2)}%
C: ${((sequence.toUpperCase().match(/C/g) || []).length / length * 100).toFixed(2)}%
    `;
    setResult(analysis);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 shadow-lg rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4">Sequence Analysis</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="sequence" className="block text-sm font-medium text-gray-200 mb-2">
              DNA Sequence
            </label>
            <div className="mt-1 relative">
              <textarea
                id="sequence"
                rows={8}
                className="block w-full rounded-lg border-gray-700 bg-gray-800 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono placeholder-gray-500"
                placeholder="Paste your DNA sequence here (FASTA format supported)..."
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
              />
              {sequence.length > 10000 && (
                <div className="absolute right-2 top-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" aria-label="Large sequence detected" />
                </div>
              )}
            </div>
          </div>
          <button
            onClick={analyzeSequence}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
          >
            Analyze
          </button>
          {result && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <pre className="text-sm text-gray-200 font-mono whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}