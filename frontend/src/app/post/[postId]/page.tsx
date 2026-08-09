import type { ReactNode } from "react";

import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
import { PostThread } from "@/components/post/PostThread";
import { getFeed, getPostThread } from "@/lib/api";
import { uniqueAuthors } from "@/lib/format";
import type { PostThreadResponse, UserSummary } from "@/lib/types";

async function loadThread(
  postId: string,
): Promise<
  | { status: "ok"; thread: PostThreadResponse }
  | { status: "not_found" }
  | { status: "error" }
> {
  try {
    const thread = await getPostThread(postId);
    return { status: "ok", thread };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "not_found") {
      return { status: "not_found" };
    }
    return { status: "error" };
  }
}

async function loadAuthors(): Promise<UserSummary[]> {
  try {
    const feed = await getFeed();
    return uniqueAuthors(feed.posts);
  } catch {
    return [];
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<ReactNode> {
  const { postId } = await params;
  const [result, authors] = await Promise.all([
    loadThread(postId),
    loadAuthors(),
  ]);

  if (result.status === "ok") {
    return (
      <AppShell active="post" authors={authors}>
        <AppHeader
          title="Post"
          subtitle="Thread view with live engagement controls"
          backHref="/"
        />
        <PostThread
          post={result.thread.post}
          comments={result.thread.comments}
        />
      </AppShell>
    );
  }

  if (result.status === "not_found") {
    return (
      <AppShell active="post" authors={authors}>
        <AppHeader title="Post" subtitle="Missing thread" backHref="/" />
        <p className="page-error">Post not found</p>
      </AppShell>
    );
  }

  return (
    <AppShell active="post" authors={authors}>
      <AppHeader title="Post" subtitle="Could not load thread" backHref="/" />
      <p className="page-error">Could not load this post.</p>
    </AppShell>
  );
}
