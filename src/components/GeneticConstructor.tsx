import { useState } from 'react';
import { Plus, Save, Download, Upload, Trash2 } from 'lucide-react';

interface GeneticElement {
  id: string;
  type: 'promoter' | 'gene' | 'terminator' | 'regulatory';
  name: string;
  sequence: string;
  color: string;
}

export default function GeneticConstructor() {
  const [elements, setElements] = useState<GeneticElement[]>([]);

  const addElement = (type: GeneticElement['type']) => {
    const newElement: GeneticElement = {
      id: Date.now().toString(),
      type,
      name: `New ${type}`,
      sequence: '',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setElements([...elements, newElement]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Genetic Constructor</h2>
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
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => addElement('promoter')}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Promoter
          </button>
          <button
            onClick={() => addElement('gene')}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Gene
          </button>
          <button
            onClick={() => addElement('terminator')}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Terminator
          </button>
          <button
            onClick={() => addElement('regulatory')}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Regulatory
          </button>
        </div>

        <div className="space-y-4">
          {elements.map((element, index) => (
            <div
              key={element.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: element.color }}
                  />
                  <input
                    type="text"
                    value={element.name}
                    onChange={(e) => {
                      const newElements = [...elements];
                      newElements[index].name = e.target.value;
                      setElements(newElements);
                    }}
                    className="form-input py-1 px-2 text-sm"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({element.type})
                  </span>
                </div>
                <button
                  onClick={() => {
                    const newElements = elements.filter(e => e.id !== element.id);
                    setElements(newElements);
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={element.sequence}
                onChange={(e) => {
                  const newElements = [...elements];
                  newElements[index].sequence = e.target.value;
                  setElements(newElements);
                }}
                className="w-full h-20 text-sm font-mono"
                placeholder="Enter sequence..."
              />
            </div>
          ))}

          {elements.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Add genetic elements to start constructing your sequence
            </div>
          )}
        </div>
      </div>

      {elements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Construct Preview</h3>
          <div className="h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
            <div className="flex items-center space-x-2">
              {elements.map((element) => (
                <div
                  key={element.id}
                  className="h-8 rounded"
                  style={{
                    backgroundColor: element.color,
                    width: Math.max(50, element.sequence.length / 2)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}