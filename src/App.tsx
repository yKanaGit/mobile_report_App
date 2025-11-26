import { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploadSection } from './components/ImageUploadSection';
import { AnalysisButton } from './components/AnalysisButton';
import { ReportSection } from './components/ReportSection';
import { MemoSection } from './components/MemoSection';
import { SubmitSection } from './components/SubmitSection';
import { Toast } from './components/Toast';
import { AnalysisResponse } from './types/report';
import { analyzeImage, submitReportToBackend } from './utils/api';

function App() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisResponse | null>(null);
  const [memo, setMemo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setReport(null);
  };

  const handleImageRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setReport(null);
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
    if (!report) return;

    const confirmed = window.confirm('このレポートを送信しますか？');
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await submitReportToBackend({
        sceneLabel: report.sceneLabel,
        objects: report.objects,
        llmReport: report.llmReport,
        memo,
      });
      setToastMessage('送信しました');

      setTimeout(() => {
        handleImageRemove();
        setMemo('');
        setReport(null);
      }, 1500);
    } catch (error) {
      console.error('送信エラー:', error);
      setToastMessage('送信に失敗しました');
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
      </main>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}

export default App;
