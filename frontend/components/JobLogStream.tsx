"use client";

import { useEffect, useState } from "react";

type Props = {
  jobId: string;
};

export default function JobLogStream({ jobId }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState("streaming");

  useEffect(() => {
    const source = new EventSource(`http://localhost:8000/jobs/${jobId}/log`);

    source.addEventListener("log", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { content: string };
      setLines((prev) => [...prev, payload.content]);
    });

    source.addEventListener("job_status", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { status: string };
      setStatus(payload.status);
      source.close();
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
      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{lines.join("\n")}</pre>
    </div>
  );
}
