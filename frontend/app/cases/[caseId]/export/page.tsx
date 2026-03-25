import Link from "next/link";

import { API_BASE, fetchCase, listOutputFiles } from "../../../../lib/api";

const OUTPUT_COPY: Record<string, string> = {
  "prediction_labels.nii.gz": "Full label map",
  "mask_wt.nii.gz": "Whole tumor mask",
  "mask_tc.nii.gz": "Tumor core mask",
  "mask_et.nii.gz": "Enhancing tumor mask",
};

export const dynamic = "force-dynamic";

export default async function ExportPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  try {
    const [caseData, outputs] = await Promise.all([fetchCase(caseId), listOutputFiles(caseId).catch(() => [])]);
    const href = `${API_BASE}/files/cases/${caseId}/export`;

    return (
      <section className="page-stack">
        <div className="page-header-split">
          <div className="page-header-copy">
            <div className="panel-eyebrow">results packaging</div>
            <h1 className="page-title">Export Case</h1>
            <p className="page-description">
              Package the generated NIfTI artifacts for <code>{caseData.label}</code> into a single download.
            </p>
          </div>
          <div className="page-actions">
            <Link href={`/cases/${caseId}`} className="button button-secondary">
              Back to workspace
            </Link>
          </div>
        </div>

        <div className="grid-2">
          <section className="frame">
            <div className="frame-header">
              <div className="stack-sm">
                <div className="frame-title">case manifest</div>
                <div className="frame-subtitle">current export context</div>
              </div>
            </div>
            <div className="frame-body stack-md">
              <div className="metric-inline">
                <span className="metric-label">case id</span>
                <span className="mono">{caseData.id}</span>
              </div>
              <div className="metric-inline">
                <span className="metric-label">label</span>
                <span className="mono">{caseData.label}</span>
              </div>
              <div className="metric-inline">
                <span className="metric-label">model used</span>
                <span className="mono">{caseData.model_used ?? "Unavailable"}</span>
              </div>
              <div className="metric-inline">
                <span className="metric-label">status</span>
                <span className="mono">{caseData.status}</span>
              </div>
            </div>
          </section>

          <section className="frame">
            <div className="frame-header">
              <div className="stack-sm">
                <div className="frame-title">export action</div>
                <div className="frame-subtitle">zip download</div>
              </div>
            </div>
            <div className="frame-body stack-md">
              <a href={href} target="_blank" rel="noreferrer" className="button">
                Download export ZIP
              </a>
              <div className="callout callout-danger">
                These outputs are for research use only and must not guide clinical decision making.
              </div>
            </div>
          </section>
        </div>

        <section className="frame">
          <div className="frame-header">
            <div className="stack-sm">
              <div className="frame-title">files included</div>
              <div className="frame-subtitle">{outputs.length} available objects</div>
            </div>
          </div>
          <div className="frame-body">
            {outputs.length === 0 ? (
              <div className="empty-state">
                <h2 className="empty-state-title">No outputs found</h2>
                <p className="empty-state-copy">
                  Run inference from the case workspace before attempting to export artifacts.
                </p>
              </div>
            ) : (
              <div className="export-list">
                {outputs.map((filename) => (
                  <div key={filename} className="export-item">
                    <div className="stack-sm">
                      <div className="export-item-name">{filename}</div>
                      <div className="export-item-copy">{OUTPUT_COPY[filename] ?? "Generated output artifact"}</div>
                    </div>
                    <span className="status-badge" data-tone="neutral">
                      nifti
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    );
  } catch {
    return (
      <section className="page-stack">
        <div className="empty-state">
          <h1 className="empty-state-title">Cannot load export details</h1>
          <p className="empty-state-copy">
            Make sure the backend is running and the case still exists, then try the export page again.
          </p>
        </div>
      </section>
    );
  }
}
