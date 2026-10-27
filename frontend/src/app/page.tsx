import type { ReactNode } from "react";

import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
import { getFeed } from "@/lib/api";
import { uniqueAuthors } from "@/lib/format";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadSeedPosts(): Promise<Post[]> {
  try {
    const feed = await getFeed();
    return feed.posts;
  } catch {
    return [];
  }
}

export default async function HomePage(): Promise<ReactNode> {
  const posts = await loadSeedPosts();
  const authors = uniqueAuthors(posts);

  return (
    <AppShell active="home" authors={authors}>
      <AppHeader
        title="Feed host"
        subtitle="A public page for any ordered list of post identifiers"
      />
      <div className="service-copy">
        <p>
          This service stores a named list of post identifiers and renders that
          list as a feed. Callers send identifiers only, and this app renders
          the page.
        </p>
        <p>
          An identifier that matches a row in the posts table renders as that
          post. Any other identifier, including an at:// URI that is not in
          this database, stays in the list and shows as a placeholder card.
        </p>
        <p>
          A program creates a feed with POST /api/v1/feeds, then reads a page
          of identifiers from GET /xrpc/app.bsky.feed.getFeedSkeleton. A person
          opens the same feed at /feed/&lt;id&gt;. Each open of that page adds
          one to the feed&apos;s load count.
        </p>
        <div className="service-actions">
          <a className="primary-link" href="/admin">
            Open admin
          </a>
        </div>
        <section>
          <h2 className="section-heading">Stored posts</h2>
          <p className="public-note">
            These identifiers are already in the posts table. Paste them into
            admin, alone or mixed with identifiers from outside this app.
          </p>
          {posts.length === 0 ? (
            <p className="page-error">Could not load the stored posts.</p>
          ) : (
            <ul className="seed-list">
              {posts.map((post) => (
                <li key={post.id}>
                  <a className="text-link" href={`/post/${encodeURIComponent(post.id)}`}>
                    {post.id}
                  </a>
                  <span>{post.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="section-heading">Skeleton request</h2>
          <pre className="api-sample">{`GET /xrpc/app.bsky.feed.getFeedSkeleton?feed=<id>&limit=30&cursor=<offset>

{
  "feed": [{ "post": "post_1" }],
  "cursor": "30"
}`}</pre>
          <p className="public-note">
            limit defaults to 30 and must be from 1 to 100. cursor is the next
            offset. The last page omits cursor. There is no sign-in.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
