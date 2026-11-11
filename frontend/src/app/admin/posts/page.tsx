import { PlaceholderSection } from "@/components/admin/PlaceholderSection";
import { getFeed } from "@/lib/api";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";
export default async function PostsPage() {
  let posts: Post[] | null = null;
  try { posts = (await getFeed()).posts; } catch { /* The page displays a loading error. */ }
  return <PlaceholderSection kind="posts" posts={posts} />;
}
