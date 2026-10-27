import type { ReactNode } from "react";

import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";

export default function AdminFeedNotFound(): ReactNode {
  return (
    <AppShell active="admin" authors={[]} wide>
      <AppHeader title="Feed" subtitle="Missing feed" backHref="/admin" />
      <p className="page-error">Feed not found</p>
    </AppShell>
  );
}