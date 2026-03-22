"use client";

import { useState } from "react";
import { uploadModalityFile } from "../lib/api";

const MODALITIES = ["flair", "t1", "t1ce", "t2"] as const;

type Props = {
  caseId: string;
  onUploaded: () => Promise<void>;
};

export default function ModalityUploadForm({ caseId, onUploaded }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function onFileSelected(modality: string, file: File | null) {
    if (!file) return;
    setBusy(modality);
    setMessage("");
    try {
      await uploadModalityFile(caseId, modality, file);
      setMessage(`Uploaded ${modality}`);
      await onUploaded();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.7rem" }}>
      <h3>Upload Modalities</h3>
      {MODALITIES.map((modality) => (
        <label key={modality} style={{ display: "grid", gap: "0.3rem" }}>
          <span style={{ textTransform: "uppercase" }}>{modality}</span>
          <input
            type="file"
            accept=".nii,.nii.gz"
            disabled={busy !== null}
            onChange={(event) => onFileSelected(modality, event.target.files?.[0] ?? null)}
          />
          {busy === modality ? <small>Uploading...</small> : null}
        </label>
      ))}
      {message ? <small>{message}</small> : null}
    </div>
  );
}
