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
      <section className="page-stack">
        <div className="empty-state">
          <div className="panel-eyebrow">case unavailable</div>
          <h1 className="empty-state-title">Cannot load this case</h1>
          <p className="empty-state-copy">
            The backend may be offline, or the case may have been deleted. Return to the case library and try again.
          </p>
        </div>
      </section>
    );
  }
}
