"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  CaseItem,
  ModelItem,
  fetchCase,
  fetchModelsForModalities,
  listOutputFiles,
} from "../lib/api";
import CaseDeleteButton from "./CaseDeleteButton";
import CaseInferencePanel from "./CaseInferencePanel";
import ModalityUploadForm from "./ModalityUploadForm";
import StatusBadge from "./StatusBadge";

const NiiVueViewer = dynamic(() => import("./viewer/NiiVueViewer"), {
  ssr: false,
  loading: () => (
    <div className="viewer-empty">
      <div className="viewer-empty-card">
        <div className="panel-eyebrow">viewer boot</div>
        <h2 className="viewer-empty-title">Initializing viewer</h2>
        <p className="viewer-empty-copy">Preparing WebGL volume rendering and overlay layers.</p>
      </div>
    </div>
  ),
});

type Props = {
  caseId: string;
  initialCase: CaseItem;
  initialModels: ModelItem[];
  initialOutputs: string[];
};

function ViewerState({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div className="viewer-empty">
      <div className="viewer-empty-card">
        <div className="panel-eyebrow">viewer state</div>
        <h2 className="viewer-empty-title">{title}</h2>
        <p className="viewer-empty-copy">{copy}</p>
      </div>
    </div>
  );
}

export default function CaseWorkspace({ caseId, initialCase, initialModels, initialOutputs }: Props) {
  const [caseData, setCaseData] = useState(initialCase);
  const [models, setModels] = useState(initialModels);
  const [outputs, setOutputs] = useState(initialOutputs);

  const refresh = useCallback(async () => {
    try {
      const latestCase = await fetchCase(caseId);
      setCaseData(latestCase);

      if (latestCase.status !== "running" && latestCase.status !== "queued") {
        const [latestModels, latestOutputs] = await Promise.all([
          fetchModelsForModalities(latestCase.modalities),
          listOutputFiles(caseId).catch(() => [] as string[]),
        ]);
        setModels(latestModels);
        setOutputs((prev) => {
          if (prev.length === latestOutputs.length && prev.every((entry, index) => entry === latestOutputs[index])) {
            return prev;
          }
          return latestOutputs;
        });
      }
    } catch {
      // Polling failures should not disrupt the workspace.
    }
  }, [caseId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const hasOutputs = outputs.length > 0;
  const isRunning = caseData.status === "running" || caseData.status === "queued";

  return (
    <div className="workspace-layout">
      <aside className="workflow-panel">
        <section className="workflow-header">
          <div className="workflow-header-top">
            <div className="stack-sm">
              <div className="panel-eyebrow">case workspace</div>
              <div className="workflow-title">{caseData.label}</div>
            </div>
            <StatusBadge value={caseData.status} />
          </div>

          {caseData.notes ? <p className="muted-text">{caseData.notes}</p> : null}

          <div className="modality-list">
            {caseData.modalities.length > 0 ? (
              caseData.modalities.map((modality) => (
                <span key={modality} className="modality-pill">
                  {modality}
                </span>
              ))
            ) : (
              <span className="subtle-text">No modalities uploaded</span>
            )}
          </div>

          <div className="workflow-meta-grid">
            <div className="meta-block">
              <div className="meta-label">model used</div>
              <div className="meta-value">{caseData.model_used ?? "Not run yet"}</div>
            </div>
            <div className="meta-block">
              <div className="meta-label">duration</div>
              <div className="meta-value">
                {caseData.inference_duration_seconds != null
                  ? `${caseData.inference_duration_seconds.toFixed(1)} seconds`
                  : "N/A"}
              </div>
            </div>
            <div className="meta-block">
              <div className="meta-label">created</div>
              <div className="meta-value">{new Date(caseData.created_at).toLocaleString()}</div>
            </div>
            <div className="meta-block">
              <div className="meta-label">updated</div>
              <div className="meta-value">{new Date(caseData.updated_at).toLocaleString()}</div>
            </div>
          </div>

          <div className="page-actions">
            {hasOutputs ? (
              <Link href={`/cases/${caseId}/export`} className="button button-secondary">
                Export outputs
              </Link>
            ) : null}
            <CaseDeleteButton
              caseId={caseId}
              caseLabel={caseData.label}
              caseStatus={caseData.status}
              redirectTo="/cases"
            />
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-section-header">
            <div className="workflow-section-title">input modalities</div>
            <div className="frame-subtitle">upload or replace FLAIR, T1, T1CE, and T2 volumes</div>
          </div>
          <div className="workflow-section-body">
            <ModalityUploadForm caseId={caseId} uploadedModalities={caseData.modalities} onUploaded={refresh} />
          </div>
        </section>

        <section className="workflow-section">
          <div className="workflow-section-header">
            <div className="workflow-section-title">model selection</div>
            <div className="frame-subtitle">choose a checkpoint and launch inference</div>
          </div>
          <div className="workflow-section-body">
            <CaseInferencePanel
              caseId={caseId}
              models={models}
              uploadedModalities={caseData.modalities}
              onJobSubmitted={async () => {
                const latestCase = await fetchCase(caseId);
                setCaseData(latestCase);
              }}
            />
          </div>
        </section>
      </aside>

      <section className="viewer-column">
        <div className="viewer-shell">
          <div className="viewer-topline">
            <div className="viewer-topline-copy">
              <div className="viewer-topline-title">segmentation review</div>
              <div className="viewer-topline-subtitle">
                Inspect generated overlays in 2D and 3D, then export NIfTI outputs if the case looks right.
              </div>
            </div>
            {hasOutputs ? (
              <Link href={`/cases/${caseId}/export`} className="button">
                Export case
              </Link>
            ) : null}
          </div>

          <div className="viewer-research-banner">
            <span className="viewer-warning-pill">Research use only - Non-diagnostic output</span>
          </div>

          {hasOutputs ? (
            <NiiVueViewer caseId={caseId} outputFiles={outputs} modalities={caseData.modalities} />
          ) : isRunning ? (
            <ViewerState
              title="Inference in progress"
              copy="The viewer will switch to the generated overlays automatically after the outputs land on disk."
            />
          ) : caseData.status === "completed" ? (
            <ViewerState
              title="Results refreshing"
              copy="Inference completed successfully. The page is waiting for the output list to refresh."
            />
          ) : caseData.modalities.length > 0 ? (
            <ViewerState
              title="Ready to run"
              copy="Your volumes are uploaded. Choose a compatible model from the left panel to generate segmentation masks."
            />
          ) : (
            <ViewerState
              title="Upload modalities to begin"
              copy="This viewer activates once the case has inputs and generated segmentation outputs."
            />
          )}
        </div>
      </section>
    </div>
  );
}
