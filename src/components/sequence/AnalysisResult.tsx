
interface AnalysisResultProps {
  result: string | null;
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  if (!result) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <pre className="text-sm text-gray-900 dark:text-gray-200 font-mono whitespace-pre-wrap">{result}</pre>
    </div>
  );
}