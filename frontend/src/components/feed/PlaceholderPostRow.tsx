import type { ReactNode } from "react";

export function PlaceholderPostRow({
  postRef,
  index = 0,
}: {
  postRef: string;
  index?: number;
}): ReactNode {
  return (
    <article
      className="post-row placeholder-row"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="avatar tone-slate" aria-hidden="true">
        ?
      </div>
      <div className="post-body">
        <div className="post-meta">
          <span className="display-name">Not in this app</span>
        </div>
        <code className="placeholder-ref">{postRef}</code>
        <p className="composer-note">
          This identifier is not in the posts table. It stays in the feed
          skeleton so a caller can resolve it.
        </p>
      </div>
    </article>
  );
}
