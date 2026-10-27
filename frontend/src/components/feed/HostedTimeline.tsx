import type { ReactNode } from "react";

import { FeedPostRow } from "@/components/feed/FeedPostRow";
import { PlaceholderPostRow } from "@/components/feed/PlaceholderPostRow";
import type { HostedFeedItem } from "@/lib/types";

export function HostedTimeline({
  items,
}: {
  items: HostedFeedItem[];
}): ReactNode {
  return (
    <section className="timeline" aria-label="Feed">
      {items.map((item, index) =>
        item.status === "known" && item.post !== null ? (
          <FeedPostRow
            key={`${item.ref}-${index}`}
            post={item.post}
            index={index}
          />
        ) : (
          <PlaceholderPostRow
            key={`${item.ref}-${index}`}
            postRef={item.ref}
            index={index}
          />
        ),
      )}
    </section>
  );
}
