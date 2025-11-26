import { FileText, Tag } from 'lucide-react';
import { Report } from '../types/report';

interface ReportSectionProps {
  report: Report | null;
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
          <p className="text-sm text-gray-800">{report.classification}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">抽出情報</h3>
          <dl className="space-y-2">
            {report.extractedFields.map((field, index) => (
              <div key={index} className="flex border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                <dt className="text-xs font-medium text-gray-600 w-28 flex-shrink-0">{field.label}</dt>
                <dd className="text-sm text-gray-800 flex-1">{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">翻訳要約</h3>
          <p className="text-sm text-gray-800 leading-relaxed">{report.translatedSummary}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">関連資料候補</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.relatedDocuments.map((doc, index) => (
              <span
                key={index}
                className="inline-block px-3 py-1 bg-white border border-slate-300 rounded-full text-xs text-gray-700"
              >
                {doc}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
