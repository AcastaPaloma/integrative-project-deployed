import { fetchModels, fetchSystemStatus, ModelItem, SystemStatus } from "../lib/api";
import StatusBadge from "../components/StatusBadge";

function gb(bytes: number): string {
  return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
}

export const dynamic = "force-dynamic";

function OfflineState() {
  return (
    <section className="page-stack">
      <div className="page-header">
        <div className="page-header-copy">
          <div className="panel-eyebrow">system overview</div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Hardware telemetry and model ranking will appear here once the local backend is responding.
          </p>
        </div>
      </div>

      <div className="empty-state">
        <div className="panel-eyebrow">backend offline</div>
        <h2 className="empty-state-title">Waiting for the API</h2>
        <p className="empty-state-copy">
          Start the FastAPI server on <code>localhost:8000</code>, then refresh this page.
        </p>
      </div>
    </section>
  );
}

function Leaderboard({ models }: { models: ModelItem[] }) {
  return (
    <section className="frame">
      <div className="frame-header">
        <div className="stack-sm">
          <div className="frame-title">model leaderboard</div>
          <div className="frame-subtitle">top 5 checkpoints ranked by mean Dice</div>
        </div>
        <StatusBadge value={`${models.length} models`} />
      </div>
      <div className="frame-body" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Model</th>
              <th>Modalities</th>
              <th>Mean Dice</th>
            </tr>
          </thead>
          <tbody>
            {models.slice(0, 5).map((model, index) => (
              <tr key={model.id}>
                <td className="mono">{String(index + 1).padStart(2, "0")}</td>
                <td>
                  <div className="stack-sm">
                    <strong>{model.name}</strong>
                    <span className="subtle-text">{model.checkpoint.split(/[\\/]/).pop()}</span>
                  </div>
                </td>
                <td>
                  <div className="modality-list">
                    {model.modalities.length > 0 ? (
                      model.modalities.map((modality) => (
                        <span key={modality} className="modality-pill">
                          {modality}
                        </span>
                      ))
                    ) : (
                      <span className="subtle-text">Unknown</span>
                    )}
                  </div>
                </td>
                <td className="mono">{model.metrics?.mean_dice?.toFixed(4) ?? "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  let status: SystemStatus | null = null;
  let models: ModelItem[] = [];

  try {
    [status, models] = await Promise.all([fetchSystemStatus(), fetchModels()]);
  } catch {
    return <OfflineState />;
  }

  const usage = status.disk.total > 0 ? (status.disk.used / status.disk.total) * 100 : 0;

  return (
    <section className="page-stack">
      <div className="page-header-split">
        <div className="page-header-copy">
          <div className="panel-eyebrow">system overview</div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Real-time runtime telemetry and checkpoint performance, presented with the same research-first framing as
            the rest of the workflow.
          </p>
        </div>
        <div className="page-actions">
          <StatusBadge value={status.device} />
          <StatusBadge value={status.cuda_available ? "compatible" : "ready"} />
        </div>
      </div>

      <section className="stats-grid">
        <div className="metric-card">
          <div className="metric-label">compute device</div>
          <div className="metric-value">{status.device.toUpperCase()}</div>
          <div className="metric-meta">{status.cuda_available ? "CUDA detected" : "CPU-only mode"}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">cuda availability</div>
          <div className="metric-value">{status.cuda_available ? "YES" : "NO"}</div>
          <div className="metric-meta">Used automatically by inference when available</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">default profile</div>
          <div className="metric-value" style={{ fontSize: "1.1rem" }}>
            {status.default_profile}
          </div>
          <div className="metric-meta">Currently applied when jobs are submitted from the UI</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">disk usage</div>
          <div className="metric-value">{usage.toFixed(1)}%</div>
          <div className="metric-meta">
            {gb(status.disk.used)} used of {gb(status.disk.total)}
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="frame">
          <div className="frame-header">
            <div className="stack-sm">
              <div className="frame-title">runtime detail</div>
              <div className="frame-subtitle">local environment snapshot</div>
            </div>
          </div>
          <div className="frame-body stack-md">
            <div className="metric-inline">
              <span className="metric-label">device</span>
              <span className="mono">{status.device.toUpperCase()}</span>
            </div>
            <div className="metric-inline">
              <span className="metric-label">cuda</span>
              <span className="mono">{status.cuda_available ? "AVAILABLE" : "UNAVAILABLE"}</span>
            </div>
            <div className="metric-inline">
              <span className="metric-label">profile</span>
              <span className="mono">{status.default_profile}</span>
            </div>
            <div className="metric-inline">
              <span className="metric-label">free space</span>
              <span className="mono">{gb(status.disk.free)}</span>
            </div>
          </div>
        </div>

        <div className="frame">
          <div className="frame-header">
            <div className="stack-sm">
              <div className="frame-title">research note</div>
              <div className="frame-subtitle">always keep the warning visible</div>
            </div>
          </div>
          <div className="frame-body">
            <div className="callout callout-danger">
              This application produces research outputs only. Segmentation masks and exported files must not be used
              for clinical decision making.
            </div>
          </div>
        </div>
      </section>

      <Leaderboard models={models} />
    </section>
  );
}
