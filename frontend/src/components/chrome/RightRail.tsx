import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { avatarTone, initials } from "@/lib/format";
import type { UserSummary } from "@/lib/types";

export function RightRail({ authors }: { authors: UserSummary[] }): ReactNode {
  return (
    <aside className="right-rail" aria-label="Sidebar">
      <section className="rail-panel rail-hero">
        <div className="rail-kicker">
          <Sparkles aria-hidden="true" size={16} />
          <span>Local demo</span>
        </div>
        <h2 className="rail-heading">Live on the feed</h2>
        <p className="rail-text">
          Seed accounts posting into the local timeline. Open any post to read
          the thread and try like or retweet.
        </p>
      </section>

      <section className="rail-panel">
        <h2 className="rail-heading">People in this demo</h2>
        <ul className="people-list">
          {authors.map((author) => (
            <li key={author.id} className="people-row">
              <div
                className={`avatar compact ${avatarTone(author.handle)}`}
                aria-hidden="true"
              >
                {initials(author.display_name)}
              </div>
              <div className="people-copy">
                <p className="people-name">{author.display_name}</p>
                <p className="people-handle">@{author.handle}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rail-panel">
        <h2 className="rail-heading">Try the path</h2>
        <ol className="rail-steps">
          <li>Scan the home timeline</li>
          <li>Open a post thread</li>
          <li>Like and retweet once</li>
        </ol>
      </section>
    </aside>
  );
}
