import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "Mock Social Media",
  description: "Local mock social media feed and post threads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): ReactNode {
  return (
    <html lang="en">
      <body className={sourceSans.variable} style={{ fontFamily: "var(--font-source-sans), sans-serif" }}>
        <main>{children}</main>
      </body>
    </html>
  );
}
