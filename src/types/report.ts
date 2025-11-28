export interface AnalyzeImageSuccess {
  ok: true;
  content: string;
  raw: unknown;
}

export interface AnalyzeImageFailure {
  ok: false;
  error: string;
  detail?: string;
}

export type AnalysisResponse = AnalyzeImageSuccess | AnalyzeImageFailure;

export interface SubmitPayload {
  content: string;
  memo: string;
  raw?: unknown;
}
