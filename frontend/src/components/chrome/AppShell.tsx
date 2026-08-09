import type { ReactNode } from "react";

import { RightRail } from "@/components/chrome/RightRail";
import { SideNav } from "@/components/chrome/SideNav";
import type { UserSummary } from "@/lib/types";

export function AppShell({
  active,
  authors,
  children,
}: {
  active: "home" | "post";
  authors: UserSummary[];
  children: React.ReactNode;
}): ReactNode {
  return (
    <div className="app-shell">
      <SideNav active={active} />
      <div className="center-column">{children}</div>
      <RightRail authors={authors} />
    </div>
  );
}
