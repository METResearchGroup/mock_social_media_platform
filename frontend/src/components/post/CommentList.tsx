import type { ReactNode } from "react";

import { FeedPostRow } from "@/components/feed/FeedPostRow";
import type { Post } from "@/lib/types";

export function CommentList({ comments }: { comments: Post[] }): ReactNode {
  if (comments.length === 0) {
    return (
      <div className="empty-comments">
        <p className="empty-title">No comments yet</p>
        <p className="muted">Replies from the seed set will show here.</p>
      </div>
    );
  }

  return (
    <section className="comment-list" aria-label="Comments">
      {comments.map((comment, index) => (
        <FeedPostRow
          key={comment.id}
          post={comment}
          index={index}
          showOpenCue={false}
        />
      ))}
    </section>
  );
}
