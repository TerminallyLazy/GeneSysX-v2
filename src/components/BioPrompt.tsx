import { useState } from 'react';
import { Wand2, Save, Copy } from 'lucide-react';

export default function BioPrompt() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const optimize = () => {
    // Simulated optimization
    setOutput(`Optimized parameters for ${input}:\n\n` +
      '1. Alignment gap penalty: -10\n' +
      '2. Match score: 2\n' +
      '3. Mismatch penalty: -3\n' +
      '4. Extension gap penalty: -0.5');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bio-promptimization</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Workflow Description
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 rounded-lg border border-gray-300 dark:border-gray-600 p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Describe your bioinformatics workflow..."
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={optimize}
            className="btn-primary"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Optimize
          </button>
          <button className="btn-secondary">
            <Save className="h-4 w-4 mr-2" />
            Save
          </button>
        </div>

        {output && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Optimized Parameters</h3>
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}