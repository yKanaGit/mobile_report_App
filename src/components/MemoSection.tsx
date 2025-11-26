import { Edit3 } from 'lucide-react';

interface MemoSectionProps {
  memo: string;
  onChange: (value: string) => void;
}

export function MemoSection({ memo, onChange }: MemoSectionProps) {
  return (
    <section className="bg-white p-4 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Edit3 className="w-5 h-5 text-slate-700" />
        <label htmlFor="memo" className="text-base font-semibold text-gray-800">
          捜査員メモ / 追加コメント
        </label>
      </div>
      <textarea
        id="memo"
        value={memo}
        onChange={(e) => onChange(e.target.value)}
        placeholder="現場で気づいた点や補足情報を記入してください"
        rows={6}
        className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
      />
    </section>
  );
}
