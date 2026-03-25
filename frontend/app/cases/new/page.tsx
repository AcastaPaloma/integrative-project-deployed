import Link from "next/link";

import NewCaseForm from "components/NewCaseForm";

export default function NewCasePage() {
  return (
    <section className="page-stack">
      <div className="page-header">
        <div className="page-header-copy">
          <div className="panel-eyebrow">task initiation</div>
          <h1 className="page-title">Create New Case</h1>
          <p className="page-description">
            Initialize a new segmentation workflow, give it a clear label, and optionally attach working notes before
            moving into upload and inference.
          </p>
        </div>
      </div>

      <div className="new-case-layout">
        <aside className="stack-md">
          <div className="frame">
            <div className="frame-header">
              <div className="frame-title">workflow note</div>
            </div>
            <div className="frame-body stack-md">
              <p className="muted-text">
                The case label is the main identifier used throughout the library, workspace, deletion flow, and export
                screens.
              </p>
              <div className="callout callout-danger">
                Research use only. Avoid patient-identifying text in labels or notes.
              </div>
            </div>
          </div>

          <div className="frame">
            <div className="frame-header">
              <div className="frame-title">next step</div>
            </div>
            <div className="frame-body stack-md">
              <p className="muted-text">After creation, you will land in the case workspace to upload modalities.</p>
              <Link href="/cases" className="button button-secondary">
                Back to library
              </Link>
            </div>
          </div>
        </aside>

        <div className="frame">
          <div className="frame-header">
            <div className="stack-sm">
              <div className="frame-title">case definition</div>
              <div className="frame-subtitle">required label, optional notes</div>
            </div>
          </div>
          <div className="frame-body">
            <NewCaseForm />
          </div>
        </div>
      </div>
    </section>
  );
}
