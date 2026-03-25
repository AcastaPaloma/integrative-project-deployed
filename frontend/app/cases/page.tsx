import Link from "next/link";

import CaseDeleteButton from "../../components/CaseDeleteButton";
import StatusBadge from "../../components/StatusBadge";
import { CaseItem, fetchCases } from "../../lib/api";

export const dynamic = "force-dynamic";

function CaseCounters({ cases }: { cases: CaseItem[] }) {
  const ready = cases.filter((item) => item.status === "ready").length;
  const running = cases.filter((item) => item.status === "running" || item.status === "queued").length;
  const completed = cases.filter((item) => item.status === "completed").length;

  return (
    <section className="stats-grid">
      <div className="metric-card">
        <div className="metric-label">total cases</div>
        <div className="metric-value">{cases.length}</div>
        <div className="metric-meta">Persistent local case records</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">ready</div>
        <div className="metric-value">{ready}</div>
        <div className="metric-meta">Ready for model selection or more uploads</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">active</div>
        <div className="metric-value">{running}</div>
        <div className="metric-meta">Queued or currently running inference</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">completed</div>
        <div className="metric-value">{completed}</div>
        <div className="metric-meta">Results available for review and export</div>
      </div>
    </section>
  );
}

function BackendOfflineState() {
  return (
    <section className="page-stack">
      <div className="page-header">
        <div className="page-header-copy">
          <div className="panel-eyebrow">case registry</div>
          <h1 className="page-title">Cases</h1>
          <p className="page-description">
            Case storage is unavailable until the backend responds at <code>localhost:8000</code>.
          </p>
        </div>
      </div>
      <div className="empty-state">
        <h2 className="empty-state-title">Cannot load the case library</h2>
        <p className="empty-state-copy">Start the backend server and refresh to browse, open, or delete cases.</p>
      </div>
    </section>
  );
}

export default async function CasesPage() {
  let cases: CaseItem[] = [];

  try {
    cases = await fetchCases();
  } catch {
    return <BackendOfflineState />;
  }

  return (
    <section className="page-stack">
      <div className="page-header-split">
        <div className="page-header-copy">
          <div className="panel-eyebrow">case registry</div>
          <h1 className="page-title">Case Library</h1>
          <p className="page-description">
            Browse local segmentation cases, review their modality coverage, and jump directly into the active
            workspace.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/cases/new" className="button">
            Create new case
          </Link>
        </div>
      </div>

      <CaseCounters cases={cases} />

      {cases.length === 0 ? (
        <div className="empty-state">
          <div className="panel-eyebrow">no cases yet</div>
          <h2 className="empty-state-title">Start by creating a case</h2>
          <p className="empty-state-copy">
            Once a case exists, you can upload modalities, run inference, inspect masks in the viewer, and export the
            outputs.
          </p>
          <div className="page-actions">
            <Link href="/cases/new" className="button">
              Create case
            </Link>
          </div>
        </div>
      ) : (
        <div className="case-library">
          {cases.map((item) => (
            <article key={item.id} className="case-row">
              <div className="case-row-main">
                <div className="case-row-title">
                  <div className="case-row-label">{item.label}</div>
                  <StatusBadge value={item.status} />
                </div>
                {item.notes ? <p className="case-row-notes">{item.notes}</p> : null}
                <div className="modality-list">
                  {item.modalities.length > 0 ? (
                    item.modalities.map((modality) => (
                      <span key={modality} className="modality-pill">
                        {modality}
                      </span>
                    ))
                  ) : (
                    <span className="subtle-text">No uploaded modalities yet</span>
                  )}
                </div>
              </div>

              <div className="case-row-meta">
                <span>
                  <strong className="mono">created</strong> {new Date(item.created_at).toLocaleString()}
                </span>
                <span>
                  <strong className="mono">updated</strong> {new Date(item.updated_at).toLocaleString()}
                </span>
                <span>
                  <strong className="mono">model</strong> {item.model_used ?? "Not run yet"}
                </span>
                <span>
                  <strong className="mono">duration</strong>{" "}
                  {item.inference_duration_seconds != null
                    ? `${item.inference_duration_seconds.toFixed(1)}s`
                    : "N/A"}
                </span>
              </div>

              <div className="case-row-actions">
                <Link href={`/cases/${item.id}`} className="button">
                  Open case
                </Link>
                <CaseDeleteButton
                  caseId={item.id}
                  caseLabel={item.label}
                  caseStatus={item.status}
                  compact
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
