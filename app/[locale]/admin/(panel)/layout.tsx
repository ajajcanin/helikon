import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { requirePageUser } from "@/server/admin/session";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser();
  return (
    <div data-theme={user.theme} className="min-h-screen bg-[var(--bg-page)] text-[var(--text-display)]">
      <AdminShell name={user.name} theme={user.theme} isAdmin={user.role === "ADMINISTRATOR"}>
        {children}
      </AdminShell>
    </div>
  );
}
