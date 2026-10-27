import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { HostedTimeline } from "@/components/feed/HostedTimeline";
import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
import { ApiError, getHostedFeed } from "@/lib/api";
import { formatTimestamp, loadCountLabel } from "@/lib/format";
import type { FeedDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadDetail(
  feedId: string,
): Promise<
  | { status: "ok"; detail: FeedDetail }
  | { status: "not_found" }
  | { status: "error" }
> {
  try {
    const detail = await getHostedFeed(feedId);
    return { status: "ok", detail };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { status: "not_found" };
    }
    return { status: "error" };
  }
}

export default async function AdminFeedPage({
  params,
}: {
  params: Promise<{ feedId: string }>;
}): Promise<ReactNode> {
  const { feedId } = await params;
  const result = await loadDetail(feedId);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <AppShell active="admin" authors={[]} wide>
        <AppHeader title="Feed" subtitle="Could not load feed" backHref="/admin" />
        <p className="page-error">Could not load this feed.</p>
      </AppShell>
    );
  }

  const { feed, posts } = result.detail;
  const lastLoaded =
    feed.last_loaded_at === null
      ? "Not yet"
      : formatTimestamp(feed.last_loaded_at, true);

  return (
    <AppShell active="admin" authors={[]} wide>
      <AppHeader
        title={feed.name}
        subtitle={loadCountLabel(feed.load_count)}
        backHref="/admin"
      />
      <dl className="stat-grid">
        <div>
          <dt>Page loads</dt>
          <dd>{feed.load_count}</dd>
        </div>
        <div>
          <dt>Last loaded</dt>
          <dd className="stat-text">{lastLoaded}</dd>
        </div>
        <div>
          <dt>Posts</dt>
          <dd>{feed.post_count}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd className="stat-text">{formatTimestamp(feed.created_at, true)}</dd>
        </div>
      </dl>
      <p className="public-link-row">
        <span className="feed-id">{feed.id}</span>
        <a className="text-link" href={`/feed/${feed.id}`}>
          Open public page
        </a>
      </p>
      <HostedTimeline items={posts} />
    </AppShell>
  );
}
