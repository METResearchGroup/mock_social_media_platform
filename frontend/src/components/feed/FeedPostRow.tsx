import Link from "next/link";
import type { ReactNode } from "react";

import type { Post } from "@/lib/types";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(displayName: string): string {
  return displayName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FeedPostRow({ post }: { post: Post }): ReactNode {
  return (
    <article className="post-row">
      <div className="avatar" aria-hidden="true">
        {initials(post.author.display_name)}
      </div>
      <div className="post-body">
        <div className="post-meta">
          <span className="display-name">{post.author.display_name}</span>
          <span className="handle">@{post.author.handle}</span>
          <span className="timestamp">{formatTimestamp(post.created_at)}</span>
        </div>
        <Link href={`/post/${post.id}`} className="post-text-link">
          <p className="post-text">{post.text}</p>
        </Link>
        <div className="engagement-counts" aria-label="Engagement counts">
          <span>{post.engagement.reply_count} replies</span>
          <span>{post.engagement.retweet_count} retweets</span>
          <span>{post.engagement.like_count} likes</span>
        </div>
      </div>
    </article>
  );
}
