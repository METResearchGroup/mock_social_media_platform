import { ChevronRight, Heart, MessageCircle, Repeat2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { avatarTone, formatTimestamp, initials } from "@/lib/format";
import type { Post } from "@/lib/types";

export function FeedPostRow({
  post,
  index = 0,
  showOpenCue = true,
}: {
  post: Post;
  index?: number;
  showOpenCue?: boolean;
}): ReactNode {
  return (
    <article
      className="post-row"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div
        className={`avatar ${avatarTone(post.author.handle)}`}
        aria-hidden="true"
      >
        {initials(post.author.display_name)}
      </div>
      <div className="post-body">
        <div className="post-meta">
          <span className="display-name">{post.author.display_name}</span>
          <span className="handle">@{post.author.handle}</span>
          <span className="meta-dot" aria-hidden="true">
            ·
          </span>
          <time className="timestamp" dateTime={post.created_at}>
            {formatTimestamp(post.created_at)}
          </time>
        </div>
        <Link href={`/post/${post.id}`} className="post-text-link">
          <p className="post-text">{post.text}</p>
          {showOpenCue ? (
            <span className="open-thread">
              Open thread
              <ChevronRight aria-hidden="true" size={16} />
            </span>
          ) : null}
        </Link>
        <div className="engagement-counts" aria-label="Engagement counts">
          <span className="metric">
            <MessageCircle aria-hidden="true" />
            {post.engagement.reply_count}
          </span>
          <span className="metric">
            <Repeat2 aria-hidden="true" />
            {post.engagement.retweet_count}
          </span>
          <span className="metric">
            <Heart aria-hidden="true" />
            {post.engagement.like_count}
          </span>
        </div>
      </div>
    </article>
  );
}
