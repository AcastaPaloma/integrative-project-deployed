"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CaseItem,
  ModelItem,
  fetchCase,
  fetchModelsForModalities,
  listOutputFiles,
} from "../lib/api";
import ModalityUploadForm from "./ModalityUploadForm";
import CaseInferencePanel from "./CaseInferencePanel";
import NiiVueViewer from "./viewer/NiiVueViewer";

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

  const refresh = useCallback(async () => {
    const [latestCase, latestModels, latestOutputs] = await Promise.all([
      fetchCase(caseId),
      fetchModelsForModalities(caseData.modalities),
      listOutputFiles(caseId).catch(() => []),
    ]);
    setCaseData(latestCase);
    setModels(latestModels);
    setOutputs(latestOutputs);
  }, [caseData.modalities, caseId]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="grid cols-2" style={{ gridTemplateColumns: "340px 1fr" }}>
      <aside className="glass-panel" style={{ padding: "1rem", display: "grid", gap: "1rem", alignContent: "start" }}>
        <h2>{caseData.label}</h2>
        <small>Status: {caseData.status}</small>
        <small>Modalities: {caseData.modalities.join(", ") || "none"}</small>
        <ModalityUploadForm caseId={caseId} onUploaded={refresh} />
        <CaseInferencePanel caseId={caseId} models={models} uploadedModalities={caseData.modalities} onJobSubmitted={refresh} />
      </aside>
      <section className="glass-panel" style={{ padding: "1rem" }}>
        <p style={{ color: "#8f1f1f", fontWeight: 700 }}>
          Non-diagnostic research output. Not for clinical decision making.
        </p>
        <NiiVueViewer caseId={caseId} outputFiles={outputs} modalities={caseData.modalities} />
      </section>
    </div>
  );
}
