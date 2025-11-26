export interface DetectedObject {
  label: string;
  score: number;
  bbox?: number[];
}

export interface AnalysisResponse {
  sceneLabel: string;
  objects: DetectedObject[];
  llmReport: string;
}

export interface SubmitPayload {
  sceneLabel: string;
  objects: DetectedObject[];
  llmReport: string;
  memo: string;
  imageId?: string;
}
