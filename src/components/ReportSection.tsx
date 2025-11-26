import { FileText, Zap } from 'lucide-react';
import { AnalysisResponse } from '../types/report';

interface ReportSectionProps {
  report: AnalysisResponse | null;
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
          <h3 className="text-sm font-semibold text-gray-700 mb-2">判別結果</h3>
          <p className="text-sm text-gray-800">{report.sceneLabel}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">検出オブジェクト</h3>
          </div>
          {report.objects.length > 0 ? (
            <ul className="space-y-2">
              {report.objects.map((obj, index) => (
                <li key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-800">{obj.label}</span>
                  <span className="inline-block px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-gray-700">
                    {(obj.score * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">オブジェクトが検出されませんでした</p>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">レポート</h3>
          <p className="text-sm text-gray-800 leading-relaxed">{report.llmReport}</p>
        </div>
      </div>
    </section>
  );
}
