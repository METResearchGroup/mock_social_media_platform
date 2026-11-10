import type { ReactNode } from "react";
import { SideNav } from "@/components/chrome/SideNav";
import type { UserSummary } from "@/lib/types";

export function AppShell({ active, children }: { active?: "home" | "post" | "admin" | "profile"; authors: UserSummary[]; wide?: boolean; children: ReactNode }): ReactNode {
  return <div className="app-shell app-shell-wide"><SideNav active={active} /><main className="center-column">{children}</main></div>;
}
