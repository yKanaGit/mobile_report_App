import {
  AnalyzeImageSuccess,
  AnalysisResponse,
  SubmitReportPayload,
  SubmitReportResponse,
} from '../types/report';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const buildUrl = (path: string) => `${apiBaseUrl}${path}`;

async function ensureJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const preview = await response.text();
    throw new Error(
      `Unexpected response (content-type: ${contentType ?? 'unknown'}): ${
        preview.slice(0, 200) || 'body is empty'
      }`,
    );
  }

  return response.json();
}

export async function analyzeImage(imageFile: File): Promise<AnalyzeImageSuccess> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(buildUrl('/api/analyze-image'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const parsed: AnalysisResponse = await ensureJsonResponse(response);

  if (!parsed.ok) {
    throw new Error(parsed.error || '解析に失敗しました');
  }

  return parsed;
}

export async function submitReportToBackend(
  payload: SubmitReportPayload,
): Promise<SubmitReportResponse> {
  const response = await fetch(buildUrl('/api/submit-report'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Submit error: ${response.status}`);
  }

  const parsed: SubmitReportResponse = await ensureJsonResponse(response);
  return parsed;
}
