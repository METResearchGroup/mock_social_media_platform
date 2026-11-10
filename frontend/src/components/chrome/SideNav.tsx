import { Home, LayoutList, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function SideNav({ active }: { active?: "home" | "post" | "admin" | "profile" }): ReactNode {
  const links = [
    { href: "/", label: "Home", icon: Home, key: "home" },
    { href: "/admin", label: "Admin", icon: LayoutList, key: "admin" },
    { href: "/profile", label: "Profile", icon: UserRound, key: "profile" },
  ];
  return <nav className="side-nav" aria-label="Primary">
    <Link href="/" className="brand-lockup"><span className="brand-mark" aria-hidden="true">M</span><span className="brand-copy"><span className="brand-name">Mock Social</span></span></Link>
    <ul className="nav-list">{links.map(({ href, label, icon: Icon, key }) => <li key={key}><Link href={href} className={active === key ? "nav-link is-active" : "nav-link"} aria-current={active === key ? "page" : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link></li>)}</ul>
  </nav>;
}
