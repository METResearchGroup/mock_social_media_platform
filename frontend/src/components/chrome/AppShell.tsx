import type { ReactNode } from "react";

import { RightRail } from "@/components/chrome/RightRail";
import { SideNav } from "@/components/chrome/SideNav";
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
  return (
    <div className={wide ? "app-shell app-shell-wide" : "app-shell"}>
      <SideNav active={active} />
      <div className="center-column">{children}</div>
      {wide ? null : <RightRail authors={authors} />}
    </div>
  );
}
