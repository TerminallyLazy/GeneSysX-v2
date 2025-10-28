import { useState } from 'react';
import { Play, Box, GitGraph, Settings } from 'lucide-react';

export default function MolecularInteractions() {
  const [molecule1, setMolecule1] = useState('');
  const [molecule2, setMolecule2] = useState('');
  const [interactionType, setInteractionType] = useState('protein-protein');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Molecular Interactions</h2>
          <div className="flex space-x-2">
            <button className="btn-secondary">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
            <button className="btn-primary">
              <Play className="h-4 w-4 mr-2" />
              Simulate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Molecule 1
            </label>
            <textarea
              value={molecule1}
              onChange={(e) => setMolecule1(e.target.value)}
              className="w-full h-48 rounded-lg border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter sequence or structure..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Molecule 2
            </label>
            <textarea
              value={molecule2}
              onChange={(e) => setMolecule2(e.target.value)}
              className="w-full h-48 rounded-lg border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter sequence or structure..."
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Interaction Type
          </label>
          <select
            value={interactionType}
            onChange={(e) => setInteractionType(e.target.value)}
            className="form-select"
          >
            <option value="protein-protein">Protein-Protein</option>
            <option value="protein-dna">Protein-DNA</option>
            <option value="protein-ligand">Protein-Ligand</option>
            <option value="dna-dna">DNA-DNA</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Box className="h-5 w-5 mr-2" />
            3D Visualization
          </h3>
          <div className="h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">3D model will appear here</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <GitGraph className="h-5 w-5 mr-2" />
            Interaction Network
          </h3>
          <div className="h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
            <GitGraph className="h-12 w-12 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}