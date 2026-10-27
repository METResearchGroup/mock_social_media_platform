import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
import { HostedTimeline } from "@/components/feed/HostedTimeline";
import { ApiError, recordFeedLoad } from "@/lib/api";
import { loadCountLabel, uniqueAuthors } from "@/lib/format";
import type { FeedDetail, Post } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadPublicFeed(
  feedId: string,
): Promise<
  | { status: "ok"; detail: FeedDetail }
  | { status: "not_found" }
  | { status: "error" }
> {
  try {
    const detail = await recordFeedLoad(feedId);
    return { status: "ok", detail };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { status: "not_found" };
    }
    return { status: "error" };
  }
}

export default async function PublicFeedPage({
  params,
}: {
  params: Promise<{ feedId: string }>;
}): Promise<ReactNode> {
  const { feedId } = await params;
  const result = await loadPublicFeed(feedId);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <AppShell authors={[]}>
        <AppHeader title="Feed" subtitle="Could not load feed" backHref="/" />
        <p className="page-error">Could not load this feed.</p>
      </AppShell>
    );
  }

  const { feed, posts } = result.detail;
  const knownPosts = posts.flatMap((item): Post[] =>
    item.post === null ? [] : [item.post],
  );

  return (
    <AppShell authors={uniqueAuthors(knownPosts)}>
      <AppHeader
        title={feed.name}
        subtitle={loadCountLabel(feed.load_count)}
        backHref="/"
      />
      <HostedTimeline items={posts} />
    </AppShell>
  );
}
