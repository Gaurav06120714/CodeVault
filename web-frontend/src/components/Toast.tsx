"use client";

import { useEffect } from "react";

export type ToastProps = {
  message: string | null;
  /** Auto-dismiss delay in ms (default 3500). */
  duration?: number;
  onDismiss: () => void;
};

/**
 * Accessible, self-contained toast — replaces native alert().
 * Announced to screen readers via role="status" + aria-live="polite",
 * auto-dismisses, and honors prefers-reduced-motion via globals.css.
 */
export function Toast({ message, duration = 3500, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1100,
        background: "var(--ink, #1a1a1a)",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 8px 30px rgba(0,0,0,.3)",
        maxWidth: "90vw",
      }}
    >
      {message}
    </div>
  );
}
