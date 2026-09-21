import type {
  AnalysisResult,
  Dataset,
  DatasetPreview,
  RegisterData,
  TokenResponse,
  User,
} from "../types";
import { clearAccessToken, readAccessToken } from "../auth/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

function createHeaders(input?: HeadersInit): Record<string, string> {
  return Object.fromEntries(new Headers(input).entries());
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = readAccessToken();
  const headers = createHeaders(options?.headers);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearAccessToken();
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    const error = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
    throw new Error(error.detail ?? "Erro na requisição");
  }
  return response.json();
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login/json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: RegisterData): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<User> {
  return request<User>("/auth/me");
}

export async function uploadDataset(file: File): Promise<Dataset> {
  const form = new FormData();
  form.append("file", file);
  return request<Dataset>("/datasets/upload", { method: "POST", body: form });
}

export async function listDatasets(): Promise<Dataset[]> {
  return request<Dataset[]>("/datasets");
}

export async function previewDataset(datasetId: string): Promise<DatasetPreview> {
  return request<DatasetPreview>(`/datasets/${datasetId}/preview?limit=10`);
}

export async function runStatistics(datasetId: string): Promise<AnalysisResult> {
  return request<AnalysisResult>("/analysis/statistics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id: datasetId }),
  });
}

export async function runKMeans(datasetId: string, columns: string[], nClusters: number): Promise<AnalysisResult> {
  return request<AnalysisResult>("/analysis/clustering/kmeans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id: datasetId, columns, n_clusters: nClusters }),
  });
}

export async function runDBSCAN(datasetId: string, columns: string[], eps: number, minSamples: number): Promise<AnalysisResult> {
  return request<AnalysisResult>("/analysis/clustering/dbscan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id: datasetId, columns, eps, min_samples: minSamples }),
  });
}

export async function runIsolationForest(datasetId: string, columns: string[], contamination: number): Promise<AnalysisResult> {
  return request<AnalysisResult>("/analysis/anomalies/isolation-forest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id: datasetId, columns, contamination }),
  });
}

export async function runAssociationRules(datasetId: string, columns: string[], minSupport: number, minConfidence: number): Promise<AnalysisResult> {
  return request<AnalysisResult>("/analysis/association-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id: datasetId, columns, min_support: minSupport, min_confidence: minConfidence }),
  });
}
