export type Dataset = {
  id: string;
  filename: string;
  rows: number;
  columns: string[];
  created_at: string;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type RegisterData = {
  email: string;
  password: string;
  full_name: string;
};

export type DatasetPreview = {
  dataset_id: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

export type AnalysisResult = {
  id: string;
  dataset_id: string;
  analysis_type: string;
  payload: Record<string, unknown>;
};
