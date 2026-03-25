"use client";

import { useEffect, useMemo, useState } from "react";

import { ModelItem, startInferenceJob } from "../lib/api";
import JobLogStream from "./JobLogStream";
import StatusBadge from "./StatusBadge";

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
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (models.length === 0) {
      setModelId("");
      return;
    }
    if (!models.find((model) => model.id === modelId)) {
      setModelId(models[0].id);
    }
  }, [models, modelId]);

  const selected = useMemo(() => models.find((model) => model.id === modelId) ?? null, [models, modelId]);
  const hasUploads = uploadedModalities.length > 0;
  const blocked = selected?.compatibility?.status === "incompatible" || !hasUploads;

  async function runInference() {
    if (!selected) return;

    setBusy(true);
    setError("");

    try {
      const job = await startInferenceJob(caseId, selected.id);
      setCurrentJobId(job.job_id);
      setQueuePosition(job.queue_position);
      await onJobSubmitted(job.job_id);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to submit job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-md">
      {!hasUploads ? (
        <div className="callout">
          Upload at least one modality before choosing a model. Compatibility details appear once the current upload set
          is known.
        </div>
      ) : null}

      {!hasUploads ? null : models.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">No models discovered</h2>
          <p className="empty-state-copy">
            The backend could not find any checkpoint-backed models to offer for inference.
          </p>
        </div>
      ) : (
        <div className="model-list">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              className="model-card"
              data-active={model.id === modelId}
              onClick={() => setModelId(model.id)}
            >
              <div className="model-card-top">
                <div className="stack-sm">
                  <div className="model-card-name">{model.name}</div>
                  <div className="modality-list">
                    {model.modalities.map((modality) => (
                      <span key={modality} className="modality-pill">
                        {modality}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="model-card-score">
                  dice {model.metrics?.mean_dice != null ? model.metrics.mean_dice.toFixed(4) : "n/a"}
                </div>
              </div>

              <div className="split-row">
                <StatusBadge value={model.compatibility?.status ?? "ready"} />
                {model.supports_subset ? <span className="subtle-text">subset-capable</span> : null}
              </div>

              <p className="model-card-copy">
                {model.compatibility?.reason ?? "Compatibility will be evaluated after modalities are uploaded."}
              </p>
            </button>
          ))}
        </div>
      )}

      {selected?.compatibility?.status === "warning" ? (
        <div className="callout callout-warning">{selected.compatibility.reason}</div>
      ) : null}

      {selected?.compatibility?.status === "incompatible" ? (
        <div className="callout callout-danger">{selected.compatibility.reason}</div>
      ) : null}

      {hasUploads ? (
        <div className="stack-sm">
          <button className="button" onClick={runInference} disabled={busy || !selected || blocked}>
            {busy ? "Submitting..." : "Run inference"}
          </button>
          {queuePosition != null ? <p className="form-note">Queued position: {queuePosition}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      ) : null}

      {currentJobId ? <JobLogStream jobId={currentJobId} /> : null}
    </div>
  );
}
