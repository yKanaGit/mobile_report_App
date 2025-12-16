import { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploadSection } from './components/ImageUploadSection';
import { AnalysisButton } from './components/AnalysisButton';
import { ReportSection } from './components/ReportSection';
import { MemoSection } from './components/MemoSection';
import { SubmitSection } from './components/SubmitSection';
import { Toast } from './components/Toast';
import { AnalyzeImageSuccess, SubmitReportPayload } from './types/report';
import { analyzeImage, submitReportToBackend } from './utils/api';

function App() {
  type ViewMode = 'edit' | 'submitted';

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [report, setReport] = useState<AnalyzeImageSuccess | null>(null);
  const [memo, setMemo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastCaseCode, setLastCaseCode] = useState<string | null>(null);
  const [lastUuid, setLastUuid] = useState<string | null>(null);
  const [lastFilePath, setLastFilePath] = useState<string | null>(null);
  const [lastOpenwebuiFileId, setLastOpenwebuiFileId] = useState<string | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [submittedReport, setSubmittedReport] = useState<
    | {
        content: string;
        memo: string;
        raw?: unknown;
        uuid: string;
        caseCode: string;
        filePath?: string;
        openwebuiFileId?: string | null;
      }
    | null
  >(null);

  const resetSubmitFeedback = () => {
    setLastCaseCode(null);
    setLastUuid(null);
    setLastFilePath(null);
    setLastOpenwebuiFileId(null);
    setSubmitError(null);
  };

  const resetToInitialState = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(null);
    setPreviewUrl(null);
    setReport(null);
    setMemo('');
    resetSubmitFeedback();
    setSubmittedReport(null);
    setToastMessage(null);
    setViewMode('edit');
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setReport(null);
    resetSubmitFeedback();
  };

  const handleImageRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setReport(null);
    resetSubmitFeedback();
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const analysisResult = await analyzeImage(selectedImage);
      setReport(analysisResult);
    } catch (error) {
      console.error('解析エラー:', error);
      setToastMessage('解析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!report?.content) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload: SubmitReportPayload = {
        content: report.content,
        memo,
        raw: report.raw,
      };

      const response = await submitReportToBackend(payload);

      if (!response.ok) {
        throw new Error('submit-report returned ok=false');
      }

      setLastCaseCode(response.caseCode);
      setLastUuid(response.uuid);
      setLastFilePath(response.filePath ?? null);
      setLastOpenwebuiFileId(
        response.openwebuiFileId === undefined ? null : response.openwebuiFileId,
      );
      setSubmittedReport({
        content: payload.content,
        memo: payload.memo,
        raw: payload.raw,
        uuid: response.uuid,
        caseCode: response.caseCode,
        filePath: response.filePath,
        openwebuiFileId: response.openwebuiFileId ?? null,
      });
      setViewMode('submitted');
      setToastMessage(`案件ID ${response.caseCode} で送信しました`);
    } catch (error) {
      console.error('Failed to submit report:', error);
      setSubmitError('レポートの送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pb-6">
        {viewMode === 'edit' && (
          <>
            <ImageUploadSection
              previewUrl={previewUrl}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
            />

            <AnalysisButton
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              disabled={!selectedImage}
            />

            <ReportSection report={report} />

            {report && (
              <>
                <MemoSection memo={memo} onChange={setMemo} />
                <SubmitSection
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  disabled={!report}
                />
              </>
            )}

            {submitError && (
              <section className="bg-white p-4 border-b border-gray-200">
                <p className="text-sm text-red-600">{submitError}</p>
              </section>
            )}
          </>
        )}

        {viewMode === 'submitted' && submittedReport && (
          <section className="bg-white p-4 border-b border-gray-200 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">
                レポート送信が完了しました
              </h2>
              <p className="text-sm text-gray-800">
                このレポートの案件ID (caseCode):{' '}
                <strong className="font-semibold">{submittedReport.caseCode}</strong>
              </p>
              <p className="text-sm text-gray-700">内部UUID: {submittedReport.uuid}</p>
              {submittedReport.filePath && (
                <p className="text-sm text-gray-700">保存先: {submittedReport.filePath}</p>
              )}
              {submittedReport.openwebuiFileId && (
                <p className="text-sm text-gray-700">
                  Open WebUI file_id: {submittedReport.openwebuiFileId}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-900">送信した内容</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">メモ</h4>
                  <pre className="bg-gray-100 text-sm text-gray-800 p-3 rounded whitespace-pre-wrap">
                    {submittedReport.memo}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">モデル解析結果</h4>
                  <pre className="bg-gray-100 text-sm text-gray-800 p-3 rounded whitespace-pre-wrap">
                    {submittedReport.content}
                  </pre>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={resetToInitialState}
                className="px-4 py-2 bg-blue-600 text-white rounded shadow"
              >
                確認しました（最初の画面に戻る）
              </button>
            </div>
          </section>
        )}
      </main>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}

export default App;
