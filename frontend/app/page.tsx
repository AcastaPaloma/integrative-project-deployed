import { fetchModels, fetchSystemStatus, SystemStatus, ModelItem } from "../lib/api";

function gb(bytes: number): string {
  return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let status: SystemStatus | null = null;
  let models: ModelItem[] = [];
  try {
    [status, models] = await Promise.all([fetchSystemStatus(), fetchModels()]);
  } catch {
    /* Backend not ready yet */
  }

  if (!status) {
    return (
      <section className="glass-panel panel-pad stack-sm" style={{ textAlign: "center", padding: "3rem" }}>
        <h2>⏳ Waiting for backend…</h2>
        <p>The backend server at <code>localhost:8000</code> is not responding yet.</p>
        <p>Wait for <code>Uvicorn running on http://…:8000</code> in the backend terminal, then refresh.</p>
        <button onClick={() => {}}>
          <a href="/">Refresh</a>
        </button>
      </section>
    );
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <section className="glass-panel panel-pad stack-sm">
        <h2>System</h2>
        <p>Device: {status.device.toUpperCase()}</p>
        <p>CUDA: {status.cuda_available ? "Available ✅" : "Not available (CPU mode)"}</p>
        <p>Default profile: {status.default_profile}</p>
        <p>Disk used: {gb(status.disk.used)} / {gb(status.disk.total)}</p>
      </section>
      <section className="glass-panel panel-pad stack-sm">
        <h2>Model Leaderboard</h2>
        <ol>
          {models.slice(0, 5).map((model) => (
            <li key={model.id}>
              {model.name} — Dice: {model.metrics?.mean_dice?.toFixed(4) ?? "N/A"}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
