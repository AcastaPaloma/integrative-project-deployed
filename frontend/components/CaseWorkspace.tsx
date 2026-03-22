"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  CaseItem,
  ModelItem,
  fetchCase,
  fetchModelsForModalities,
  listOutputFiles,
} from "../lib/api";
import ModalityUploadForm from "./ModalityUploadForm";
import CaseInferencePanel from "./CaseInferencePanel";

const NiiVueViewer = dynamic(() => import("./viewer/NiiVueViewer"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "2rem", textAlign: "center", color: "#6b8ab3" }}>
      Initializing viewer…
    </div>
  ),
});

type Props = {
  caseId: string;
  initialCase: CaseItem;
  initialModels: ModelItem[];
  initialOutputs: string[];
};

export default function CaseWorkspace({ caseId, initialCase, initialModels, initialOutputs }: Props) {
  const [caseData, setCaseData] = useState(initialCase);
  const [models, setModels] = useState(initialModels);
  const [outputs, setOutputs] = useState(initialOutputs);

  const modalitiesRef = useRef(caseData.modalities);
  modalitiesRef.current = caseData.modalities;

  const refresh = useCallback(async () => {
    try {
      const latestCase = await fetchCase(caseId);
      setCaseData(latestCase);

      /* Only fetch models + outputs when NOT in a transient state to reduce load */
      const status = latestCase.status;
      if (status !== "running" && status !== "queued") {
        const [latestModels, latestOutputs] = await Promise.all([
          fetchModelsForModalities(latestCase.modalities),
          listOutputFiles(caseId).catch(() => [] as string[]),
        ]);
        setModels(latestModels);
        setOutputs((prev) => {
          if (prev.length === latestOutputs.length && prev.every((v, i) => v === latestOutputs[i])) {
            return prev;
          }
          return latestOutputs;
        });
      }
    } catch {
      /* network hiccup during poll — silently retry next cycle */
    }
  }, [caseId]);

  useEffect(() => {
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  /* Determine what to show in the viewer area */
  const hasOutputs = outputs.length > 0;
  const isRunning = caseData.status === "running" || caseData.status === "queued";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "1rem" }}>
      <aside className="glass-panel" style={{ padding: "1.2rem", display: "grid", gap: "1rem", alignContent: "start" }}>
        <div>
          <h2>{caseData.label}</h2>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <span className="status-badge" data-status={caseData.status}>{caseData.status}</span>
            {caseData.modalities.length > 0 ? (
              caseData.modalities.map((m) => (
                <span key={m} style={{ padding: "0.15rem 0.5rem", borderRadius: 8, background: "rgba(22,100,216,0.1)", color: "#1664d8", fontSize: "0.82rem", fontWeight: 600, textTransform: "uppercase" }}>{m}</span>
              ))
            ) : (
              <small>No modalities uploaded</small>
            )}
          </div>
        </div>
        <ModalityUploadForm caseId={caseId} onUploaded={refresh} />
        <CaseInferencePanel
          caseId={caseId}
          models={models}
          uploadedModalities={caseData.modalities}
          onJobSubmitted={async () => {
            /* just refresh case status, don't do heavy model/output fetch */
            const latestCase = await fetchCase(caseId);
            setCaseData(latestCase);
          }}
        />
      </aside>
      <section className="glass-panel" style={{ padding: "1.2rem", display: "grid", gap: "0.8rem", alignContent: "start" }}>
        <p style={{ color: "#8f1f1f", fontWeight: 700, margin: 0, fontSize: "0.85rem" }}>
          ⚠ Non-diagnostic research output. Not for clinical decision making.
        </p>
        {hasOutputs ? (
          <NiiVueViewer caseId={caseId} outputFiles={outputs} modalities={caseData.modalities} />
        ) : isRunning ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#6b8ab3", fontSize: "1.05rem", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>⏳</span>
            <span>Inference is running…</span>
            <small>The viewer will load automatically once results are ready.</small>
          </div>
        ) : caseData.modalities.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#6b8ab3", fontSize: "1.05rem", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🧠</span>
            <span>{caseData.modalities.length} modality file(s) uploaded</span>
            <small>Select a model and run inference to generate brain segmentation results.</small>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "#6b8ab3" }}>
            Upload modalities to get started.
          </div>
        )}
      </section>
    </div>
  );
}
