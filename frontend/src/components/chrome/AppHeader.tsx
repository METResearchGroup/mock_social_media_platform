import type { ReactNode } from "react";
import Link from "next/link";

export function AppHeader({ title }: { title: string }): ReactNode {
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        Mock Social
      </Link>
      <p className="header-title">{title}</p>
    </header>
  );
}
