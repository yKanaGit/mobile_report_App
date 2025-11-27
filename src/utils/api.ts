import { AnalysisResponse, SubmitPayload } from '../types/report';

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

export async function analyzeImage(imageFile: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(buildUrl('/api/analyze-image'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return ensureJsonResponse(response);
}

export async function submitReportToBackend(payload: SubmitPayload): Promise<void> {
  const response = await fetch(buildUrl('/api/submit-report'), {
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
