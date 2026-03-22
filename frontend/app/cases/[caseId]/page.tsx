import CaseWorkspace from "components/CaseWorkspace";
import { fetchCase, fetchModelsForModalities, listOutputFiles } from "../../../lib/api";

export const dynamic = "force-dynamic";

export default async function CaseViewerPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  try {
    const caseData = await fetchCase(caseId);
    const [models, outputs] = await Promise.all([
      fetchModelsForModalities(caseData.modalities),
      listOutputFiles(caseId).catch(() => []),
    ]);
    return <CaseWorkspace caseId={caseId} initialCase={caseData} initialModels={models} initialOutputs={outputs} />;
  } catch {
    return (
      <section className="glass-panel panel-pad stack-sm" style={{ textAlign: "center", padding: "3rem" }}>
        <h2>⏳ Cannot load case</h2>
        <p>The backend at <code>localhost:8000</code> is not responding. Make sure it is running, then refresh.</p>
      </section>
    );
  }
}
