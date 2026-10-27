import type { ReactNode } from "react";

import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";

export default function FeedNotFound(): ReactNode {
  return (
    <AppShell authors={[]}>
      <AppHeader title="Feed" subtitle="Missing feed" backHref="/" />
      <p className="page-error">Feed not found</p>
    </AppShell>
  );
}
