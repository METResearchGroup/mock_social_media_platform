import type { ReactNode } from "react";

import { FeedPostRow } from "@/components/feed/FeedPostRow";
import type { Post } from "@/lib/types";

export function FeedTimeline({ posts }: { posts: Post[] }): ReactNode {
  return (
    <section className="timeline" aria-label="Home feed">
      {posts.map((post) => (
        <FeedPostRow key={post.id} post={post} />
      ))}
    </section>
  );
}
