import { fetchModels, fetchSystemStatus } from "../lib/api";

function gb(bytes: number): string {
  return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
}

export default async function DashboardPage() {
  const [status, models] = await Promise.all([fetchSystemStatus(), fetchModels()]);
  return (
    <div className="grid cols-2">
      <section className="glass-panel" style={{ padding: "1rem" }}>
        <h2>System</h2>
        <p>Device: {status.device.toUpperCase()}</p>
        <p>CUDA: {status.cuda_available ? "Available" : "Not available"}</p>
        <p>Default profile: {status.default_profile}</p>
        <p>Disk used: {gb(status.disk.used)} / {gb(status.disk.total)}</p>
      </section>
      <section className="glass-panel" style={{ padding: "1rem" }}>
        <h2>Model Leaderboard</h2>
        <ol>
          {models.slice(0, 5).map((model) => (
            <li key={model.id}>
              {model.name} - Dice: {model.metrics?.mean_dice ?? "N/A"}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
