"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Props = {
  jobId: string;
};

export default function JobLogStream({ jobId }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState("streaming");

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/jobs/${jobId}/log`);

    source.addEventListener("log", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { content: string };
      setLines((prev) => [...prev, payload.content]);
    });

    source.addEventListener("job_status", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { status: string };
      setStatus(payload.status);
      source.close();

      /* When job finishes, reload the page so the viewer picks up new outputs */
      if (payload.status === "completed" || payload.status === "failed") {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    });

    source.onerror = () => {
      setStatus("connection-error");
      source.close();
    };

    return () => source.close();
  }, [jobId]);

  return (
    <div className="glass-panel" style={{ padding: "0.8rem", maxHeight: "320px", overflow: "auto" }}>
      <strong>Job log ({status})</strong>
      {status === "completed" && <small style={{ color: "#1a8a3f", marginLeft: "0.5rem" }}>✓ Reloading…</small>}
      {status === "failed" && <small style={{ color: "#a71d2a", marginLeft: "0.5rem" }}>✗ Check log for errors</small>}
      <pre style={{ whiteSpace: "pre-wrap", margin: 0, marginTop: "0.5rem" }}>{lines.join("\n")}</pre>
    </div>
  );
}
