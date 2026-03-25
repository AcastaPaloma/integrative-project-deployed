"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";

import { createCase } from "../lib/api";

export default function NewCaseForm() {
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "note">("note");
  const [submitting, setSubmitting] = useState(false);
  const [newCaseId, setNewCaseId] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const created = await createCase({ label: label.trim(), notes: notes.trim() });
      setMessageTone("success");
      setMessage(`Case created as ${created.label}. You can open the workspace immediately.`);
      setNewCaseId(created.id);
      setLabel("");
      setNotes("");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setMessageTone("error");
      setMessage(`Creation failed: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  }

  function onLabelChange(event: ChangeEvent<HTMLInputElement>) {
    setLabel(event.target.value);
  }

  function onNotesChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setNotes(event.target.value);
  }

  return (
    <form className="stack-lg" onSubmit={onSubmit}>
      <div className="field-row">
        <label htmlFor="new-case-label" className="field-label">
          Case label
        </label>
        <input
          id="new-case-label"
          required
          value={label}
          onChange={onLabelChange}
          placeholder="e.g. BRATS_2026_CASE_001"
        />
        <p className="field-hint">Use a unique, readable label. Avoid any patient-identifying information.</p>
      </div>

      <div className="field-row">
        <label htmlFor="new-case-notes" className="field-label">
          Notes
        </label>
        <textarea
          id="new-case-notes"
          value={notes}
          onChange={onNotesChange}
          placeholder="Optional working notes, acquisition details, or research context."
          rows={7}
        />
        <p className="field-hint">Notes are stored with the case and shown in the library for quick context.</p>
      </div>

      <div className="page-actions">
        <button disabled={submitting || label.trim().length === 0} type="submit" className="button">
          {submitting ? "Creating..." : "Create case"}
        </button>
      </div>

      {message ? (
        <p className={messageTone === "success" ? "form-success" : messageTone === "error" ? "form-error" : "form-note"}>
          {message}
        </p>
      ) : null}

      {newCaseId ? (
        <div className="callout callout-success">
          <div className="stack-sm">
            <strong>Case ready.</strong>
            <span>
              Open <Link href={`/cases/${newCaseId}`}>{`/cases/${newCaseId}`}</Link> to upload modalities and run
              inference.
            </span>
          </div>
        </div>
      ) : null}
    </form>
  );
}
