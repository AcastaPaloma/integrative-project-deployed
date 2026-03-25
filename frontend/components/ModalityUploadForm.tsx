"use client";

import { useState } from "react";

import { uploadModalityFile } from "../lib/api";

const MODALITIES = ["flair", "t1", "t1ce", "t2"] as const;

type Props = {
  caseId: string;
  uploadedModalities: string[];
  onUploaded: () => Promise<void>;
};

type Notice =
  | { tone: "success"; text: string }
  | { tone: "error"; text: string }
  | null;

export default function ModalityUploadForm({ caseId, uploadedModalities, onUploaded }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [errorModality, setErrorModality] = useState<string | null>(null);

  async function onFileSelected(modality: string, file: File | null) {
    if (!file) return;

    setBusy(modality);
    setNotice(null);
    setErrorModality(null);

    try {
      await uploadModalityFile(caseId, modality, file);
      setNotice({ tone: "success", text: `${modality.toUpperCase()} uploaded successfully.` });
      await onUploaded();
    } catch (error) {
      setErrorModality(modality);
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack-md">
      <div className="upload-grid">
        {MODALITIES.map((modality) => {
          const isBusy = busy === modality;
          const isUploaded = uploadedModalities.includes(modality);
          const hasError = errorModality === modality;
          const state = isBusy ? "uploading" : hasError ? "error" : isUploaded ? "uploaded" : "idle";

          return (
            <div key={modality} className="upload-card" data-state={state}>
              <div className="upload-card-title">
                <span>{modality}</span>
                <span className="upload-card-state">
                  {isBusy ? "Uploading" : hasError ? "Failed" : isUploaded ? "Ready" : "Awaiting file"}
                </span>
              </div>

              <p className="upload-card-copy">
                {isBusy
                  ? "Saving the volume into the canonical case input store."
                  : isUploaded
                    ? "A NIfTI file is already present for this modality. Upload again to replace it."
                    : "Accepted formats: .nii and .nii.gz"}
              </p>

              <div className="upload-card-actions">
                <label className="button button-secondary" style={{ width: "100%" }}>
                  {isBusy ? "Uploading..." : isUploaded ? "Replace file" : "Choose file"}
                  <input
                    className="file-input"
                    type="file"
                    accept=".nii,.nii.gz"
                    disabled={busy !== null}
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      void onFileSelected(modality, nextFile);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {notice ? (
        <p className={notice.tone === "success" ? "form-success" : "form-error"}>
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
