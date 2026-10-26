"use client";
import { useEffect, useState } from "react";

// Defaults to the original AHQ dark theme; users can save light mode.
export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(current);
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    setTheme(next);
    try { localStorage.setItem("ahq-theme", next); } catch {}
  }
  return (
    <button type="button" onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      aria-pressed={theme === "light"}
      className="ahq-theme-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-body transition-colors">
      {theme === "dark" ? (
        <svg aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      ) : (
        <svg aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20.99 13.01A9 9 0 0 1 10.99 3a9 9 0 1 0 10 10.01Z"/></svg>
      )}
    </button>
  );
}
