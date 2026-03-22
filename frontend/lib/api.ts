export type SystemStatus = {
  cuda_available: boolean;
  device: "cpu" | "cuda";
  default_profile: string;
  disk: { total: number; used: number; free: number };
};

export type ModelItem = {
  id: string;
  name: string;
  checkpoint: string;
  modalities: string[];
  supports_subset: boolean;
  metrics?: { mean_dice?: number | null };
  compatibility?: {
    status: "compatible" | "warning" | "incompatible";
    reason: string;
    missing: string[];
  } | null;
};

export type CaseItem = {
  id: string;
  label: string;
  notes: string;
  status: string;
  modalities: string[];
  model_used: string | null;
  created_at: string;
  updated_at: string;
  inference_duration_seconds: number | null;
};

export type JobItem = {
  id: string;
  case_id: string;
  status: string;
  model_id: string;
  profile: string;
  selected_modalities: string[];
  queue_position: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const response = await fetch(`${API_BASE}/system/status`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch system status");
  return response.json();
}

export async function fetchModels(): Promise<ModelItem[]> {
  const response = await fetch(`${API_BASE}/models`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch models");
  const payload = await response.json();
  return payload.items as ModelItem[];
}

export async function fetchModelsForModalities(modalities: string[]): Promise<ModelItem[]> {
  const q = modalities.join(",");
  const response = await fetch(`${API_BASE}/models?uploaded_modalities=${encodeURIComponent(q)}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch models");
  const payload = await response.json();
  return payload.items as ModelItem[];
}

export async function fetchCases(): Promise<CaseItem[]> {
  const response = await fetch(`${API_BASE}/cases`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch cases");
  const payload = await response.json();
  return payload.items as CaseItem[];
}

export async function createCase(input: {
  label: string;
  notes?: string;
  modalities?: string[];
}): Promise<CaseItem> {
  const response = await fetch(`${API_BASE}/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Failed to create case");
  return response.json();
}

export async function fetchCase(caseId: string): Promise<CaseItem> {
  const response = await fetch(`${API_BASE}/cases/${caseId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch case");
  return response.json();
}

export async function uploadModalityFile(caseId: string, modality: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE}/cases/${caseId}/upload/${modality}`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? "Upload failed");
  }
  return response.json();
}

export async function startInferenceJob(caseId: string, modelId: string, profile = "tuned") {
  const response = await fetch(`${API_BASE}/cases/${caseId}/infer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_id: modelId, profile }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? "Failed to start inference");
  }
  return response.json() as Promise<{ job_id: string; status: string; queue_position: number | null }>;
}

export async function fetchJob(jobId: string): Promise<JobItem> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch job");
  return response.json();
}

export async function listOutputFiles(caseId: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}/files/cases/${caseId}/outputs`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to list output files");
  const payload = await response.json();
  return payload.items as string[];
}
