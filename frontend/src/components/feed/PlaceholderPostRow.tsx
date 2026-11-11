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
          <span className="display-name">Post unavailable</span>
        </div>
        <code className="placeholder-ref">{postRef}</code>
        <p className="composer-note">
          This post is currently unavailable.
        </p>
      </div>
    </article>
  );
}
