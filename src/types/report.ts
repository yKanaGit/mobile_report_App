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

export interface SubmitReportPayload {
  content: string;
  memo: string;
  raw?: unknown;
}

export interface SubmitReportResponse {
  ok: boolean;
  uuid: string;
  caseCode: string;
  filePath?: string;
  openwebuiFileId?: string | null;
}
