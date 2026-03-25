"use client";

import { useEffect, useRef, useState } from "react";

import { API_BASE } from "../lib/api";

type Props = {
  jobId: string;
};

export default function JobLogStream({ jobId }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState("streaming");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const streamRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.scrollTop = stream.scrollHeight;
  }, [lines]);

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/jobs/${jobId}/log`);

    source.addEventListener("log", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { content: string };
      setLines((prev) => [...prev, payload.content]);
    });

    source.addEventListener("job_status", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as { status: string; error_message?: string | null };
      setStatus(payload.status);
      setErrorMessage(payload.error_message ?? null);
      source.close();

      if (payload.status === "completed" || payload.status === "failed") {
        window.setTimeout(() => {
          window.location.reload();
        }, 1400);
      }
    });

    source.onerror = () => {
      setStatus("connection-error");
      source.close();
    };

    return () => source.close();
  }, [jobId]);

  return (
    <section className="job-log">
      <div className="job-log-header">
        <span>job log</span>
        <span>{status}</span>
      </div>
      <pre ref={streamRef} className="job-log-stream">
        {lines.length > 0 ? lines.join("\n") : "Waiting for the first log line..."}
        {errorMessage ? `\n\nERROR: ${errorMessage}` : ""}
      </pre>
    </section>
  );
}
