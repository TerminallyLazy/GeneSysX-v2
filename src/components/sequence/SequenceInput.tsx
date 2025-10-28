import { AlertCircle } from 'lucide-react';

interface SequenceInputProps {
  sequence: string;
  onChange: (value: string) => void;
  label: string;
}

export default function SequenceInput({ sequence, onChange, label }: SequenceInputProps) {
  return (
    <div>
      <label htmlFor="sequence" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        {label}
      </label>
      <div className="mt-1 relative">
        <textarea
          id="sequence"
          rows={8}
          className="block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Paste your DNA sequence here (FASTA format supported)..."
          value={sequence}
          onChange={(e) => onChange(e.target.value)}
        />
        {sequence.length > 10000 && (
          <div className="absolute right-2 top-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" aria-label="Large sequence detected" />
          </div>
        )}
      </div>
    </div>
  );
}