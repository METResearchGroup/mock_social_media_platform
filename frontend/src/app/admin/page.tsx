import type { ReactNode } from "react";

import { CreateFeedForm } from "@/components/admin/CreateFeedForm";
import { FeedTable } from "@/components/admin/FeedTable";
import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
import { listHostedFeeds } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { FeedSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadFeeds(): Promise<
  { status: "ok"; feeds: FeedSummary[] } | { status: "error" }
> {
  try {
    const feeds = await listHostedFeeds();
    return { status: "ok", feeds };
  } catch {
    return { status: "error" };
  }
}

export default async function AdminPage(): Promise<ReactNode> {
  const result = await loadFeeds();

  return (
    <AppShell active="admin" authors={[]} wide>
      <AppHeader
        title="Admin"
        subtitle="Create a feed and copy its public link"
      />
      <CreateFeedForm />
      <section className="admin-list" aria-label="Feeds">
        <h2 className="section-heading">Feeds</h2>
        {result.status === "error" ? (
          <p className="page-error">Could not load feeds.</p>
        ) : null}
        {result.status === "ok" && result.feeds.length === 0 ? (
          <p className="empty-feeds">No feeds yet. Create one above.</p>
        ) : null}
        {result.status === "ok" && result.feeds.length > 0 ? (
          <FeedTable
            rows={result.feeds.map((feed) => ({
              id: feed.id,
              name: feed.name,
              postCount: feed.post_count,
              loadCount: feed.load_count,
              createdLabel: formatTimestamp(feed.created_at),
            }))}
          />
        ) : null}
      </section>
    </AppShell>
  );
}
