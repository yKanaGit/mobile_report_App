import { FileText, ListTree } from 'lucide-react';
import { AnalyzeImageSuccess } from '../types/report';

interface ReportSectionProps {
  report: AnalyzeImageSuccess | null;
}

export function ReportSection({ report }: ReportSectionProps) {
  if (!report) return null;

  return (
    <section className="bg-white p-4 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-slate-700" />
        <h2 className="text-base font-semibold text-gray-800">簡易レポート（自動生成）</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">レポート内容</h3>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{report.content}</p>
        </div>

        <details className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <summary className="flex items-center gap-2 cursor-pointer select-none">
            <ListTree className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">モデルの詳細レスポンス</span>
          </summary>
          <pre className="mt-3 text-xs text-gray-700 bg-white border border-slate-200 rounded p-3 overflow-auto max-h-60 whitespace-pre-wrap break-words">
            {JSON.stringify(report.raw, null, 2)}
          </pre>
        </details>
      </div>
    </section>
  );
}
