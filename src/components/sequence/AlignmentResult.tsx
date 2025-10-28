import { AlignmentResult, AlignmentAlgorithm, colorMap } from './types';

interface AlignmentResultProps {
  result: AlignmentResult;
  isDarkMode: boolean;
  algorithm: AlignmentAlgorithm;
}

export default function AlignmentResultView({ result, isDarkMode, algorithm }: AlignmentResultProps) {
  const renderAlignedSequence = (sequence: string) => {
    return sequence.split('').map((char, index) => (
      <span
        key={index}
        className={`inline-block w-6 h-6 text-center ${
          colorMap[char.toUpperCase()]?.[isDarkMode ? 'dark' : 'light'] || 'bg-gray-100 dark:bg-gray-700'
        } text-gray-900 dark:text-gray-100`}
      >
        {char}
      </span>
    ));
  };

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {algorithm === 'smith-waterman' ? 'Local' : 'Global'} Alignment Results
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Using {algorithm === 'smith-waterman' ? 'Smith-Waterman' : 'Needleman-Wunsch'} algorithm
          <br />
          Alignment score: {result.score}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 pb-2">Sequence</th>
              <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 pb-2">Alignment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-sm text-gray-900 dark:text-white pr-4">Sequence 1</td>
              <td className="font-mono text-sm">
                {renderAlignedSequence(result.alignment1)}
              </td>
            </tr>
            <tr>
              <td className="text-sm text-gray-900 dark:text-white pr-4">Sequence 2</td>
              <td className="font-mono text-sm">
                {renderAlignedSequence(result.alignment2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}