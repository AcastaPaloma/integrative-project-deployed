"use client";

import { useMemo, useState } from "react";
import { startInferenceJob, ModelItem } from "../lib/api";
import JobLogStream from "./JobLogStream";

type Props = {
  caseId: string;
  models: ModelItem[];
  uploadedModalities: string[];
  onJobSubmitted: (jobId: string) => Promise<void>;
};

export default function CaseInferencePanel({ caseId, models, uploadedModalities, onJobSubmitted }: Props) {
  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const compatibleModels = useMemo(() => {
    return models.map((m) => ({
      ...m,
      compatibility: m.compatibility,
      score: m.metrics?.mean_dice,
    }));
  }, [models]);

  const selected = compatibleModels.find((m) => m.id === modelId);
  const blocked = selected?.compatibility?.status === "incompatible";

  async function runInference() {
    setBusy(true);
    setError("");
    try {
      const job = await startInferenceJob(caseId, modelId);
      setCurrentJobId(job.job_id);
      await onJobSubmitted(job.job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.8rem" }}>
      <h3>Run Inference</h3>
      <label>
        Model
        <select value={modelId} onChange={(event) => setModelId(event.target.value)}>
          {compatibleModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.score ?? "N/A"}) [{model.compatibility?.status ?? "unknown"}]
            </option>
          ))}
        </select>
      </label>
      <button onClick={runInference} disabled={busy || !modelId || blocked}>
        {busy ? "Submitting..." : "Start inference"}
      </button>
      {selected?.compatibility ? <small>{selected.compatibility.reason}</small> : null}
      {error ? <small style={{ color: "#8f1f1f" }}>{error}</small> : null}
      {currentJobId ? <JobLogStream jobId={currentJobId} /> : null}
    </div>
  );
}
