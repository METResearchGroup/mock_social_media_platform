import type { ReactNode } from "react";
import { CreateFeedForm } from "@/components/admin/CreateFeedForm";
import { FeedTable } from "@/components/admin/FeedTable";
import { AdminNav } from "@/components/chrome/AdminNav";
import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
import { listHostedFeeds } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { FeedSummary } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function AdminPage(): Promise<ReactNode> {
  let feeds: FeedSummary[] | null = null;
  try { feeds = await listHostedFeeds(); } catch { /* Show a useful error below. */ }
  return <AppShell active="admin" authors={[]} wide><AppHeader title="Admin" subtitle="Manage your content and studies" /><AdminNav active="feeds" />
    <section className="admin-list"><div className="section-title-row"><div><h2 className="section-heading">Feeds</h2><p className="public-note">Manage and share your feeds.</p></div></div>
      {feeds === null ? <p className="page-error">Unable to load feeds. Please try again later.</p> : feeds.length === 0 ? <p className="empty-feeds">No feeds yet. Create your first feed below.</p> : <FeedTable rows={feeds.map((feed) => ({ id: feed.id, name: feed.name, postCount: feed.post_count, loadCount: feed.load_count, createdAt: feed.created_at, createdLabel: formatTimestamp(feed.created_at) }))} />}
    </section><details className="create-disclosure"><summary>Create feed</summary><CreateFeedForm /></details>
  </AppShell>;
}
