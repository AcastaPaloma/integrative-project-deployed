"use client";

import { FormEvent, startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { deleteCase } from "../lib/api";

type Props = {
  caseId: string;
  caseLabel: string;
  caseStatus: string;
  redirectTo?: string;
  compact?: boolean;
};

export default function CaseDeleteButton({
  caseId,
  caseLabel,
  caseStatus,
  redirectTo,
  compact = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const blocked = useMemo(
    () => ["queued", "running"].includes(caseStatus.toLowerCase()),
    [caseStatus],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (confirmValue !== caseLabel || busy) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await deleteCase(caseId);
      setOpen(false);
      if (redirectTo) {
        startTransition(() => {
          router.push(redirectTo);
        });
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Failed to delete case",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={compact ? "button button-danger button-inline" : "button button-danger button-secondary"}
        onClick={() => setOpen(true)}
        disabled={blocked}
        title={blocked ? "Cases with queued or running inference cannot be deleted." : undefined}
      >
        Delete case
      </button>

      {open ? (
        <div className="modal-backdrop" role="presentation" onClick={() => !busy && setOpen(false)}>
          <div className="modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="panel-eyebrow">destructive action</div>
                <h2 className="modal-title">Delete this case?</h2>
              </div>
              <button
                type="button"
                className="button button-secondary button-inline"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Close
              </button>
            </div>

            <p className="modal-copy">
              This removes the case record, uploaded files, generated outputs, and stored job history. This action
              cannot be undone.
            </p>

            <div className="callout callout-danger">
              <strong>Confirmation required.</strong> Type <code>{caseLabel}</code> to enable deletion.
            </div>

            <form className="stack-md" onSubmit={onSubmit}>
              <label className="field-label" htmlFor={`delete-${caseId}`}>
                Confirm case label
              </label>
              <input
                id={`delete-${caseId}`}
                value={confirmValue}
                onChange={(event) => setConfirmValue(event.target.value)}
                placeholder={caseLabel}
                autoComplete="off"
              />

              {error ? <p className="form-error">{error}</p> : null}

              <div className="dialog-actions">
                <button type="button" className="button button-secondary" onClick={() => setOpen(false)} disabled={busy}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-danger"
                  disabled={busy || confirmValue !== caseLabel}
                >
                  {busy ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
