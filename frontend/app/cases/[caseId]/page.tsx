import CaseWorkspace from "components/CaseWorkspace";
import { fetchCase, fetchModelsForModalities, listOutputFiles } from "../../../lib/api";

export default async function CaseViewerPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const caseData = await fetchCase(caseId);
  const [models, outputs] = await Promise.all([
    fetchModelsForModalities(caseData.modalities),
    listOutputFiles(caseId).catch(() => []),
  ]);

  return <CaseWorkspace caseId={caseId} initialCase={caseData} initialModels={models} initialOutputs={outputs} />;
}
