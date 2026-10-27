"use client";

import type { ReactNode } from "react";

import { RightRail } from "@/components/chrome/RightRail";
import { SideNav } from "@/components/chrome/SideNav";
import {
  useViewMode,
  ViewModeToggle,
} from "@/components/chrome/ViewModeToggle";
import type { UserSummary } from "@/lib/types";

export function AppShell({
  active,
  authors,
  wide = false,
  children,
}: {
  active?: "home" | "post" | "admin";
  authors: UserSummary[];
  wide?: boolean;
  children: React.ReactNode;
}): ReactNode {
  const { mode, setMode } = useViewMode();
  const showAdminRail = !wide && mode === "admin";

  return (
    <div
      className={showAdminRail ? "app-shell" : "app-shell app-shell-wide"}
      data-view-mode={wide ? undefined : mode}
    >
      <SideNav active={active} />
      <div className="center-column">
        {wide ? null : <ViewModeToggle mode={mode} onChange={setMode} />}
        {children}
      </div>
      {showAdminRail ? <RightRail authors={authors} /> : null}
    </div>
  );
}
