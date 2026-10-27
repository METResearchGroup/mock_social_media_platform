import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AppHeader({
  title,
  subtitle,
  backHref,
  showFeedTabs = false,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  showFeedTabs?: boolean;
}): ReactNode {
  return (
    <header className="app-header">
      <div className="header-row">
        {backHref ? (
          <Link href={backHref} className="back-chip" aria-label="Back">
            <ArrowLeft aria-hidden="true" size={18} />
            <span>Back</span>
          </Link>
        ) : null}
        <div className="header-titles">
          <h1 className="header-title">{title}</h1>
          {subtitle ? <p className="header-subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {showFeedTabs ? (
        <div className="feed-tabs" role="tablist" aria-label="Timeline filters">
          <button type="button" className="feed-tab is-active" role="tab" aria-selected="true">
            For you
          </button>
          <button type="button" className="feed-tab" role="tab" aria-selected="false" disabled>
            Following
          </button>
        </div>
      ) : null}
    </header>
  );
}
