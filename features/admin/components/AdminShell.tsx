"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { Link, usePathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { setTheme } from "../actions";

type Item = { href: string; label: string; icon: IconName; adminOnly?: boolean };

export function AdminShell({
  name,
  theme,
  isAdmin,
  children,
}: {
  name: string;
  theme: "dark" | "light";
  isAdmin: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups: { title: string; items: Item[] }[] = [
    {
      title: t("groupSales"),
      items: [
        { href: "/admin", label: t("navOverview"), icon: "overview" },
        { href: "/admin/narudzbe", label: t("navOrders"), icon: "orders" },
        { href: "/admin/dostava", label: t("navDelivery"), icon: "delivery" },
        { href: "/admin/analitika", label: t("navAnalytics"), icon: "analytics" },
      ],
    },
    {
      title: t("groupCatalog"),
      items: [
        { href: "/admin/artikli", label: t("navProducts"), icon: "products" },
        { href: "/admin/kategorije", label: t("navCategories"), icon: "categories" },
        { href: "/admin/proizvodjaci", label: t("navManufacturers"), icon: "manufacturers" },
        { href: "/admin/potvrda", label: t("navReview"), icon: "review" },
      ],
    },
    {
      title: t("groupSystem"),
      items: [
        { href: "/admin/integracije", label: t("navIntegrations"), icon: "integrations" },
        { href: "/admin/korisnici", label: t("navUsers"), icon: "users", adminOnly: true },
        { href: "/admin/postavke", label: t("navSettings"), icon: "settings", adminOnly: true },
        { href: "/admin/historija", label: t("navHistory"), icon: "history" },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  async function toggleTheme() {
    await setTheme({ theme: theme === "dark" ? "light" : "dark" });
    router.refresh();
  }

  async function logout() {
    await authClient.signOut();
    router.replace("/admin/prijava");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen font-ui text-sm">
      {open && (
        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-page)] transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          // Invisible as well as moved away, so the closed menu can't be reached by keyboard on a phone.
          open ? "translate-x-0" : "max-md:invisible -translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/admin" className="font-display text-base tracking-[0.18em]">
            HELIKON
          </Link>
          <button
            type="button"
            aria-label={t("closeMenu")}
            onClick={() => setOpen(false)}
            className="md:hidden"
          >
            <Icon name="close" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="mb-1.5 px-2 text-xs tracking-[0.08em] text-[var(--text-muted)]">{group.title}</p>
              <ul>
                {group.items
                  .filter((item) => isAdmin || !item.adminOnly)
                  .map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-[2px] px-2 py-2",
                          isActive(item.href)
                            ? "bg-[var(--accent-subtle)] text-[var(--accent-bright)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-display)]",
                        )}
                      >
                        <Icon name={item.icon} />
                        {item.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex flex-col items-start gap-2 border-t border-[var(--border-subtle)] px-5 py-4 text-[var(--text-secondary)]">
          <span className="text-[var(--text-display)]">{name}</span>
          <button
            type="button"
            onClick={toggleTheme}
            className="text-[var(--accent-bright)] underline underline-offset-4"
          >
            {theme === "dark" ? t("themeLight") : t("themeDark")}
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-[var(--accent-bright)] underline underline-offset-4"
          >
            {t("logout")}
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3 md:hidden">
          <button type="button" aria-label={t("menu")} onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
          <span className="font-display tracking-[0.18em]">HELIKON</span>
        </header>
        <main className="mx-auto max-w-[1100px] px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
