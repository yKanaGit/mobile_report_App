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

  const resetSubmitFeedback = () => {
    setLastCaseCode(null);
    setLastUuid(null);
    setLastFilePath(null);
    setLastOpenwebuiFileId(null);
    setSubmitError(null);
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

        {lastCaseCode && (
          <section className="bg-white p-4 border-b border-gray-200 space-y-2">
            <p className="text-sm text-gray-800">
              このレポートの案件ID (caseCode):{' '}
              <strong className="font-semibold">{lastCaseCode}</strong>
            </p>
            {lastUuid && <p className="text-sm text-gray-700">内部UUID: {lastUuid}</p>}
            {lastFilePath && (
              <p className="text-sm text-gray-700">保存先: {lastFilePath}</p>
            )}
            {lastOpenwebuiFileId && (
              <p className="text-sm text-gray-700">
                Open WebUI file_id: {lastOpenwebuiFileId}
              </p>
            )}
            <p className="text-sm text-gray-800 font-medium">
              Open WebUI で検索する際は、案件ID (caseCode) を使って検索してください。
            </p>
          </section>
        )}

        {submitError && (
          <section className="bg-white p-4 border-b border-gray-200">
            <p className="text-sm text-red-600">{submitError}</p>
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
