import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin · Helikon",
  robots: { index: false, follow: false, nocache: true },
};

/** /admin is rendered per request, never cached, behind login. */
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-display)]">{children}</div>;
}
