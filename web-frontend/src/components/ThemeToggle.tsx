"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getStoredTheme, setTheme, watchSystemTheme, type Theme } from "@/utils/theme";

const ORDER: Theme[] = ["Light", "Dark", "System"];

const ICONS: Record<Theme, ReactNode> = {
  Light: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  Dark: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  ),
  System: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  ),
};

/** Compact theme switcher (Light → Dark → System) for the sidebar/topbar. */
export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>("System");

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    setTheme(stored);
    return watchSystemTheme(() => getStoredTheme());
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setThemeState(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      title={`Theme: ${theme} (click to change)`}
      aria-label={`Theme: ${theme}. Click to switch.`}
    >
      {ICONS[theme]}
      <span>{theme}</span>
    </button>
  );
}
