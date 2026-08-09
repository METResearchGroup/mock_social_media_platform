import type { ReactNode } from "react";

import { AppHeader } from "@/components/chrome/AppHeader";
import { FeedTimeline } from "@/components/feed/FeedTimeline";
import { getFeed } from "@/lib/api";
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

  if (result.status === "ok") {
    return (
      <>
        <AppHeader title="Home" />
        <FeedTimeline posts={result.posts} />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Home" />
      <p className="page-error">
        Could not load the feed. Start the FastAPI server on port 8000.
      </p>
    </>
  );
}
