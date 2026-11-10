import type { ReactNode } from "react";
import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
import { FeedTimeline } from "@/components/feed/FeedTimeline";
import { getFeed } from "@/lib/api";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";
export default async function HomePage(): Promise<ReactNode> {
  let posts: Post[] | null = null;
  try { posts = (await getFeed()).posts; } catch { /* Show a useful error below. */ }
  return <AppShell active="home" authors={[]}><AppHeader title="Home" subtitle="Discover posts" />{posts === null ? <p className="page-error">Unable to load posts. Please try again later.</p> : posts.length ? <FeedTimeline posts={posts} /> : <p className="page-error">No posts to display yet.</p>}</AppShell>;
}
