import { Send, Loader2 } from 'lucide-react';

interface SubmitSectionProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled: boolean;
}

export function SubmitSection({ onSubmit, isSubmitting, disabled }: SubmitSectionProps) {
  return (
    <section className="bg-white p-4">
      <button
        onClick={onSubmit}
        disabled={disabled || isSubmitting}
        className="w-full py-4 px-4 bg-slate-800 text-white font-bold text-base rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors shadow-md"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>送信中…</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>送信</span>
          </>
        )}
      </button>
    </section>
  );
}
