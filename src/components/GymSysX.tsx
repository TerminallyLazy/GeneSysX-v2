import { useState } from 'react';
import { Play, Download, ChevronRight } from 'lucide-react';

interface Environment {
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'Classic' | 'Custom';
}

export default function GymSysX() {
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  
  const environments: Environment[] = [
    {
      name: 'CartPole-v1',
      description: 'Balance a pole on a cart by moving left or right',
      difficulty: 'Easy',
      type: 'Classic'
    },
    {
      name: 'LunarLander-v2',
      description: 'Land a spacecraft on a landing pad',
      difficulty: 'Medium',
      type: 'Classic'
    },
    {
      name: 'Protein-Fold-v1',
      description: 'Optimize protein folding using RL',
      difficulty: 'Hard',
      type: 'Custom'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">GymSysX</h2>
          <div className="flex gap-2">
            <button className="btn-primary">
              <Play className="w-4 h-4 mr-2" />
              Train
            </button>
            <button className="btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              Export Model
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {environments.map((env) => (
            <div
              key={env.name}
              className={`p-4 rounded-lg border ${
                selectedEnv === env.name
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700'
              } cursor-pointer hover:border-blue-500 dark:hover:border-blue-400`}
              onClick={() => setSelectedEnv(env.name)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">{env.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  env.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  env.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {env.difficulty}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{env.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{env.type}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEnv && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Training Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Algorithm
              </label>
              <select className="form-select">
                <option>PPO (Proximal Policy Optimization)</option>
                <option>DQN (Deep Q Network)</option>
                <option>A2C (Advantage Actor Critic)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Learning Rate
              </label>
              <input type="number" defaultValue="0.0003" step="0.0001" className="form-input" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}