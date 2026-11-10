import type { ReactNode } from "react";
import type { Post } from "../../lib/types";

export function StoredPosts({ posts }: { posts: Post[] | null }): ReactNode {
  return <section aria-labelledby="stored-posts-heading">
    <h3 id="stored-posts-heading" className="section-heading">Home feed posts</h3>
    <p className="public-note">Use these post identifiers when creating a feed.</p>
    {posts === null ? <p className="empty-feeds" role="status">Unable to load posts. Please try again later.</p> : posts.length === 0 ? <p className="empty-feeds">No posts available.</p> : <ul className="seed-list">{posts.map((post) => <li key={post.id}>
      <a className="text-link" href={`/post/${encodeURIComponent(post.id)}`}>{post.id}</a>
      <span>{post.text}</span>
    </li>)}</ul>}
  </section>;
}
