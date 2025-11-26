import { Loader2, Scan } from 'lucide-react';

interface AnalysisButtonProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled: boolean;
}

export function AnalysisButton({ onAnalyze, isAnalyzing, disabled }: AnalysisButtonProps) {
  return (
    <section className="bg-white px-4 py-5 border-b border-gray-200">
      <button
        onClick={onAnalyze}
        disabled={disabled || isAnalyzing}
        className="w-full py-3 px-4 bg-slate-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors shadow-sm"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>解析中…</span>
          </>
        ) : (
          <>
            <Scan className="w-5 h-5" />
            <span>解析開始</span>
          </>
        )}
      </button>
    </section>
  );
}
