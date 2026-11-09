"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight theme toggle: persists to localStorage, defaults to
 * prefers-color-scheme. Injects `.dark` on <html>.
 * No flash: layout.tsx sets initial class via inline script.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("llmreviewpro-theme") as
      | "light"
      | "dark"
      | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("llmreviewpro-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md border border-[var(--border)]"
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
