import type { ReactNode } from "react";

import { CommentList } from "@/components/post/CommentList";
import { EngagementBar } from "@/components/post/EngagementBar";
import { avatarTone, formatTimestamp, initials } from "@/lib/format";
import type { Post } from "@/lib/types";

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
        <div
          className={`avatar large ${avatarTone(post.author.handle)}`}
          aria-hidden="true"
        >
          {initials(post.author.display_name)}
        </div>
        <div className="post-body">
          <div className="post-meta stacked">
            <span className="display-name">{post.author.display_name}</span>
            <span className="handle">@{post.author.handle}</span>
          </div>
          <p className="post-text detail-text">{post.text}</p>
          <time className="timestamp detail-time" dateTime={post.created_at}>
            {formatTimestamp(post.created_at)}
          </time>
          <EngagementBar
            postId={post.id}
            initialEngagement={post.engagement}
          />
        </div>
      </div>
      <div className="comments-banner">
        <h2 className="section-heading">Comments</h2>
        <p className="section-note">
          {comments.length} direct replies on this thread
        </p>
      </div>
      <CommentList comments={comments} />
    </article>
  );
}
