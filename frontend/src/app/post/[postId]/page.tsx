import Link from "next/link";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/chrome/AppHeader";
import { PostThread } from "@/components/post/PostThread";
import { getPostThread } from "@/lib/api";
import type { PostThreadResponse } from "@/lib/types";

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

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<ReactNode> {
  const { postId } = await params;
  const result = await loadThread(postId);

  if (result.status === "ok") {
    return (
      <>
        <AppHeader title="Post" />
        <Link href="/" className="back-link">
          Home
        </Link>
        <PostThread
          post={result.thread.post}
          comments={result.thread.comments}
        />
      </>
    );
  }

  if (result.status === "not_found") {
    return (
      <>
        <AppHeader title="Post" />
        <Link href="/" className="back-link">
          Home
        </Link>
        <p className="page-error">Post not found</p>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Post" />
      <Link href="/" className="back-link">
        Home
      </Link>
      <p className="page-error">Could not load this post.</p>
    </>
  );
}
