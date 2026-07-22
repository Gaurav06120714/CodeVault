"use client";

import { useEffect, useRef, useState } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as a destructive action. */
  danger?: boolean;
  busy?: boolean;
  /**
   * GitHub-style safety: when set, the user must type this exact phrase before the
   * confirm button enables — prevents accidental destructive actions.
   */
  confirmPhrase?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Accessible confirmation modal — replaces native window.confirm().
 * - role="dialog" + aria-modal, labelled by its title and described by its message
 * - focus moves to the confirm button on open; Escape cancels; backdrop click cancels
 * - honors prefers-reduced-motion via globals.css
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  confirmPhrase,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");

  // Reset the typed phrase whenever the dialog opens/closes.
  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // If a phrase is required, focus the input; otherwise the confirm button.
    (confirmPhrase ? inputRef.current : confirmRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, confirmPhrase]);

  if (!open) return null;

  const phraseOk = !confirmPhrase || typed.trim() === confirmPhrase;
  const confirmDisabled = busy || !phraseOk;

  return (
    <div
      role="presentation"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.45)",
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper, #fff)",
          color: "var(--ink, #1a1a1a)",
          borderRadius: 14,
          border: "1px solid var(--border-2, rgba(0,0,0,.1))",
          maxWidth: 420,
          width: "100%",
          padding: 24,
          boxShadow: "0 12px 40px rgba(0,0,0,.25)",
        }}
      >
        <h2 id="confirm-dialog-title" style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
          {title}
        </h2>
        <p id="confirm-dialog-message" style={{ margin: "0 0 16px", color: "var(--muted, #555)", fontSize: 14.5, lineHeight: 1.5 }}>
          {message}
        </p>

        {confirmPhrase && (
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="confirm-phrase" style={{ display: "block", fontSize: 13, color: "var(--muted, #555)", marginBottom: 6 }}>
              Type <b style={{ color: "var(--ink, #1a1a1a)", fontFamily: "var(--font-mono, monospace)" }}>{confirmPhrase}</b> to confirm
            </label>
            <input
              ref={inputRef}
              id="confirm-phrase"
              type="text"
              className="txt"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && phraseOk && !busy) onConfirm(); }}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={`Type ${confirmPhrase} to confirm`}
              style={{ width: "100%" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={danger ? "btn" : "btn brand"}
            onClick={onConfirm}
            disabled={confirmDisabled}
            style={danger ? { background: "var(--danger, #c0392b)", color: "#fff", borderColor: "transparent", opacity: confirmDisabled ? 0.55 : 1 } : { opacity: confirmDisabled ? 0.55 : 1 }}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
