"use client";

import { useEffect } from "react";

/**
 * Wires the landing page's mobile hamburger (#menuBtn) to toggle the nav
 * dropdown (#navLinks) via the `body.nav-open` class. Closes on outside tap
 * and Escape. Used because the landing page is a server component and inline
 * <script> tags injected by React don't execute.
 */
export function MobileNavScript() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("#menuBtn")) {
        document.body.classList.toggle("nav-open");
      } else if (!t.closest("#navLinks")) {
        document.body.classList.remove("nav-open");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") document.body.classList.remove("nav-open");
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("nav-open");
    };
  }, []);

  return null;
}
