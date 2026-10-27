"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export type ViewMode = "admin" | "user";

const STORAGE_KEY = "msmp-view-mode";

export function useViewMode(): {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
} {
  const [mode, setModeState] = useState<ViewMode>("admin");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "user" || stored === "admin") {
      setModeState(stored);
    }
  }, []);

  function setMode(next: ViewMode): void {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return { mode, setMode };
}

export function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}): ReactNode {
  return (
    <div className="view-toggle" role="group" aria-label="Audience">
      <p className="view-toggle-label">Audience</p>
      <div className="view-toggle-options">
        <button
          type="button"
          className={
            mode === "admin"
              ? "view-toggle-option is-selected"
              : "view-toggle-option"
          }
          aria-pressed={mode === "admin"}
          onClick={() => onChange("admin")}
        >
          View as admin
        </button>
        <button
          type="button"
          className={
            mode === "user"
              ? "view-toggle-option is-selected"
              : "view-toggle-option"
          }
          aria-pressed={mode === "user"}
          onClick={() => onChange("user")}
        >
          View as user
        </button>
      </div>
    </div>
  );
}
