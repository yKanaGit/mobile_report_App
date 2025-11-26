import { AnalysisResponse, SubmitPayload } from '../types/report';

export async function analyzeImage(imageFile: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function submitReportToBackend(payload: SubmitPayload): Promise<void> {
  const response = await fetch('/api/submit-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Submit error: ${response.statusText}`);
  }
}
