import { useState } from 'react';
import { Upload, Download, Play, Table, PieChart, BarChart2 } from 'lucide-react';

export default function FunctionalEnrichment() {
  const [geneList, setGeneList] = useState('');
  const [database, setDatabase] = useState('GO');
  const [pValueCutoff, setPValueCutoff] = useState(0.05);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Functional Enrichment Analysis</h2>
          <div className="flex space-x-2">
            <button className="btn-secondary">
              <Upload className="h-4 w-4 mr-2" />
              Import List
            </button>
            <button className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export Results
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
              Gene List (One per line)
            </label>
            <textarea
              value={geneList}
              onChange={(e) => setGeneList(e.target.value)}
              className="w-full h-64 rounded-lg border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter gene IDs or symbols..."
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Database
              </label>
              <select
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="form-select"
              >
                <option value="GO">Gene Ontology</option>
                <option value="KEGG">KEGG Pathways</option>
                <option value="Reactome">Reactome</option>
                <option value="InterPro">InterPro Domains</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                p-value Cutoff
              </label>
              <input
                type="number"
                value={pValueCutoff}
                onChange={(e) => setPValueCutoff(Number(e.target.value))}
                step="0.01"
                min="0"
                max="1"
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Table className="h-5 w-5 mr-2" />
            Enrichment Table
          </h3>
          <div className="h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Results will appear here</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Visualization
          </h3>
          <div className="h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
            <BarChart2 className="h-12 w-12 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}