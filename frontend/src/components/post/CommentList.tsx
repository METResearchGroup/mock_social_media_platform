import type { ReactNode } from "react";

import { FeedPostRow } from "@/components/feed/FeedPostRow";
import type { Post } from "@/lib/types";

export function CommentList({ comments }: { comments: Post[] }): ReactNode {
  if (comments.length === 0) {
    return <p className="muted">No comments yet.</p>;
  }

  return (
    <section className="comment-list" aria-label="Comments">
      {comments.map((comment) => (
        <FeedPostRow key={comment.id} post={comment} />
      ))}
    </section>
  );
}
