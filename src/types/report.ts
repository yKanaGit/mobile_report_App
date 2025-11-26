export interface ExtractedField {
  label: string;
  value: string;
}

export interface Report {
  classification: string;
  extractedFields: ExtractedField[];
  translatedSummary: string;
  relatedDocuments: string[];
}

export interface SubmitData {
  report: Report;
  memo: string;
  imageUrl: string;
  timestamp: string;
}
