import type { ReactNode } from "react";

import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
import { ComposerStrip } from "@/components/feed/ComposerStrip";
import { FeedTimeline } from "@/components/feed/FeedTimeline";
import { getFeed } from "@/lib/api";
import { uniqueAuthors } from "@/lib/format";
import type { Post } from "@/lib/types";

// Server component fetch against NEXT_PUBLIC_API_BASE_URL for local FastAPI.
async function loadFeedPosts(): Promise<
  { status: "ok"; posts: Post[] } | { status: "error" }
> {
  try {
    const feed = await getFeed();
    return { status: "ok", posts: feed.posts };
  } catch {
    return { status: "error" };
  }
}

export default async function HomePage(): Promise<ReactNode> {
  const result = await loadFeedPosts();
  const authors = result.status === "ok" ? uniqueAuthors(result.posts) : [];

  if (result.status === "ok") {
    return (
      <AppShell active="home" authors={authors}>
        <AppHeader
          title="Home"
          subtitle="Your local timeline of seeded research posts"
          showFeedTabs
        />
        <ComposerStrip />
        <FeedTimeline posts={result.posts} />
      </AppShell>
    );
  }

  return (
    <AppShell active="home" authors={[]}>
      <AppHeader title="Home" subtitle="Waiting for the local API" />
      <p className="page-error">
        Could not load the feed. Start the FastAPI server on port 8000.
      </p>
    </AppShell>
  );
}
