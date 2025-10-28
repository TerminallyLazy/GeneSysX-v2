import { useState } from 'react';
import { Upload, Download, Play, Settings, ZoomIn, ZoomOut } from 'lucide-react';

export default function PhylogeneticAnalysis() {
  const [sequences, setSequences] = useState<string>('');
  const [method, setMethod] = useState('neighbor-joining');
  const [distanceModel, setDistanceModel] = useState('jukes-cantor');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Phylogenetic Analysis</h2>
          <div className="flex space-x-2">
            <button className="btn-secondary">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <button className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="btn-primary">
              <Play className="h-4 w-4 mr-2" />
              Run Analysis
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
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="form-select"
              >
                <option value="neighbor-joining">Neighbor-Joining</option>
                <option value="maximum-likelihood">Maximum Likelihood</option>
                <option value="parsimony">Maximum Parsimony</option>
                <option value="bayesian">Bayesian Inference</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Distance Model
              </label>
              <select
                value={distanceModel}
                onChange={(e) => setDistanceModel(e.target.value)}
                className="form-select"
              >
                <option value="jukes-cantor">Jukes-Cantor</option>
                <option value="kimura">Kimura 2-Parameter</option>
                <option value="tamura-nei">Tamura-Nei</option>
                <option value="gtr">General Time Reversible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Advanced Settings
              </label>
              <button className="btn-secondary w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tree Visualization</h3>
          <div className="flex space-x-2">
            <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <ZoomIn className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <ZoomOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            Tree visualization will appear here after analysis
          </p>
        </div>
      </div>
    </div>
  );
}