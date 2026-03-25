export default function SettingsPage() {
  return (
    <section className="page-stack">
      <div className="page-header">
        <div className="page-header-copy">
          <div className="panel-eyebrow">system configuration</div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">
            This surface exists in the product today, but runtime controls are still managed by backend configuration
            rather than interactive UI controls.
          </p>
        </div>
      </div>

      <div className="grid-2">
        <section className="frame">
          <div className="frame-header">
            <div className="stack-sm">
              <div className="frame-title">current state</div>
              <div className="frame-subtitle">placeholder screen</div>
            </div>
          </div>
          <div className="frame-body stack-md">
            <div className="callout">
              Settings are not editable from the browser yet. The existing implementation keeps this page as a future
              expansion point.
            </div>
            <div className="stack-sm">
              <div className="metric-inline">
                <span className="metric-label">profile control</span>
                <span className="mono">backend-managed</span>
              </div>
              <div className="metric-inline">
                <span className="metric-label">hardware control</span>
                <span className="mono">automatic</span>
              </div>
              <div className="metric-inline">
                <span className="metric-label">ui state</span>
                <span className="mono">read-only placeholder</span>
              </div>
            </div>
          </div>
        </section>

        <section className="frame">
          <div className="frame-header">
            <div className="stack-sm">
              <div className="frame-title">future scope</div>
              <div className="frame-subtitle">kept visible for product continuity</div>
            </div>
          </div>
          <div className="frame-body stack-md">
            <p className="muted-text">
              When UI settings are added later, this page is the natural place for runtime profile switching, hardware
              preferences, and environment diagnostics.
            </p>
            <div className="callout callout-warning">
              The current implementation should not suggest adjustable settings that do not exist yet.
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
