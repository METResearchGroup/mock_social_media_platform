import type { ReactNode } from "react";
import { AppHeader } from "@/components/chrome/AppHeader";
import { AppShell } from "@/components/chrome/AppShell";
export default function ProfilePage(): ReactNode {
  return <AppShell active="profile" authors={[]}><AppHeader title="Profile" /><section className="service-copy"><h2 className="section-heading">Your profile</h2><p>Profile settings are not available yet.</p></section></AppShell>;
}
