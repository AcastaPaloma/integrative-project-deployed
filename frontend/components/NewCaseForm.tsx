"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { createCase } from "../lib/api";
import Link from "next/link";

export default function NewCaseForm() {
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newCaseId, setNewCaseId] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const created = await createCase({ label, notes });
      setMessage(`Created case ${created.label} (${created.id})`);
      setLabel("");
      setNotes("");
      setNewCaseId(created.id);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setMessage(`Failed: ${detail}`);
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
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.8rem", maxWidth: "560px" }}>
      <label>
        Case label
        <input
          required
          value={label}
          onChange={onLabelChange}
          style={{ width: "100%" }}
        />
      </label>
      <label>
        Notes
        <textarea value={notes} onChange={onNotesChange} style={{ width: "100%" }} />
      </label>
      <button disabled={submitting} type="submit">
        {submitting ? "Creating..." : "Create case"}
      </button>
      {message && <p>{message}</p>}
      {newCaseId ? <Link href={`/cases/${newCaseId}`}>Open created case</Link> : null}
    </form>
  );
}
