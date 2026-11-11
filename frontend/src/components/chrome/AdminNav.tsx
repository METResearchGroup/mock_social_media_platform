import Link from "next/link";
import type { ReactNode } from "react";

export function AdminNav({ active }: { active: "feeds" | "posts" | "experiments" | "documentation" }): ReactNode {
  const links = [["feeds", "Feeds", "/admin"], ["posts", "Posts", "/admin/posts"], ["experiments", "Experiments", "/admin/experiments"], ["documentation", "Documentation", "/admin/documentation"]];
  return <nav className="admin-nav" aria-label="Admin sections">{links.map(([key, label, href]) => <Link key={key} href={href} className={key === active ? "admin-nav-link is-active" : "admin-nav-link"} aria-current={key === active ? "page" : undefined}>{label}</Link>)}</nav>;
}
