// Theme controller — Light / Dark / System, persisted and applied to <html data-theme>.
// The actual color values live in globals.css under html[data-theme="dark"].
export type Theme = "Light" | "Dark" | "System";

const STORAGE_KEY = "cv-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "System";
  const t = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return t === "Light" || t === "Dark" || t === "System" ? t : "System";
}

/** Resolve System → the OS preference; otherwise the explicit choice. */
export function resolveTheme(t: Theme): "light" | "dark" {
  if (t === "System") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return t === "Dark" ? "dark" : "light";
}

export function applyTheme(t: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolveTheme(t));
}

export function setTheme(t: Theme): void {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, t);
  applyTheme(t);
}

/** Re-apply on OS theme change while the user is on "System". Returns a cleanup fn. */
export function watchSystemTheme(getCurrent: () => Theme): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getCurrent() === "System") applyTheme("System");
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
