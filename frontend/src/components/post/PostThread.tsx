import type { ReactNode } from "react";

import { CommentList } from "@/components/post/CommentList";
import { EngagementBar } from "@/components/post/EngagementBar";
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

export function PostThread({
  post,
  comments,
}: {
  post: Post;
  comments: Post[];
}): ReactNode {
  return (
    <article className="post-thread">
      <div className="post-row detail">
        <div className="avatar large" aria-hidden="true">
          {initials(post.author.display_name)}
        </div>
        <div className="post-body">
          <div className="post-meta">
            <span className="display-name">{post.author.display_name}</span>
            <span className="handle">@{post.author.handle}</span>
          </div>
          <p className="post-text detail-text">{post.text}</p>
          <p className="timestamp">{formatTimestamp(post.created_at)}</p>
          <EngagementBar
            postId={post.id}
            initialEngagement={post.engagement}
          />
        </div>
      </div>
      <h2 className="section-heading">Comments</h2>
      <CommentList comments={comments} />
    </article>
  );
}
