import { Bell, Home, LayoutList, Search, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function SideNav({
  active,
}: {
  active?: "home" | "post" | "admin";
}): ReactNode {
  return (
    <nav className="side-nav" aria-label="Primary">
      <Link href="/" className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          M
        </span>
        <span className="brand-copy">
          <span className="brand-name">Mock Social</span>
          <span className="brand-tag">Lab feed host</span>
        </span>
      </Link>

      <ul className="nav-list">
        <li>
          <Link
            href="/"
            className={active === "home" ? "nav-link is-active" : "nav-link"}
            aria-current={active === "home" ? "page" : undefined}
          >
            <Home aria-hidden="true" />
            <span>Home</span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin"
            className={active === "admin" ? "nav-link is-active" : "nav-link"}
            aria-current={active === "admin" ? "page" : undefined}
          >
            <LayoutList aria-hidden="true" />
            <span>Admin</span>
          </Link>
        </li>
        <li>
          <span className="nav-link is-disabled" aria-disabled="true">
            <Search aria-hidden="true" />
            <span>Explore</span>
          </span>
        </li>
        <li>
          <span className="nav-link is-disabled" aria-disabled="true">
            <Bell aria-hidden="true" />
            <span>Alerts</span>
          </span>
        </li>
        <li>
          <span className="nav-link is-disabled" aria-disabled="true">
            <UserRound aria-hidden="true" />
            <span>Profile</span>
          </span>
        </li>
      </ul>

      <div className="nav-footer">
        <p className="nav-footnote">Public feed host. No sign-in.</p>
      </div>
    </nav>
  );
}
