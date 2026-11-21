"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { isStaff } from "@/lib/staff-marker";

/**
 * A thin bar above the shop with links into the admin, like WordPress has, shown only in a browser where someone has
 * used the admin. On a product page it also opens that product for editing.
 */
const BAR_HEIGHT = "28px";

export function AdminBar() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  // Read after loading: the cached page has to look the same for every visitor.
  useEffect(() => setShow(isStaff()), []);
  // The shop's header sticks just below the bar, so both stay in view.
  useEffect(() => {
    if (!show) return;
    document.documentElement.style.setProperty("--admin-bar", BAR_HEIGHT);
    return () => {
      document.documentElement.style.removeProperty("--admin-bar");
    };
  }, [show]);
  if (!show) return null;
  const product = pathname.match(/^\/proizvod\/([^/]+)/)?.[1];
  const link = "text-[var(--text-secondary)] hover:text-[var(--text-display)]";
  return (
    <nav
      aria-label={t("barLabel")}
      style={{ height: BAR_HEIGHT }}
      className="sticky top-0 z-[60] flex items-center gap-x-5 overflow-x-auto bg-black px-4 font-ui text-xs whitespace-nowrap"
    >
      <Link href="/admin" className="font-semibold tracking-[0.12em] text-[var(--accent-bright)] uppercase">
        {t("barTitle")}
      </Link>
      {product && (
        <Link
          href={`/admin/artikli/web/${product}`}
          className="text-[var(--text-display)] underline underline-offset-2"
        >
          {t("barEditProduct")}
        </Link>
      )}
      <Link href="/admin/artikli" className={link}>
        {t("navProducts")}
      </Link>
      <Link href="/admin/dopuna" className={link}>
        {t("navMissing")}
      </Link>
      <Link href="/admin/narudzbe" className={link}>
        {t("navOrders")}
      </Link>
    </nav>
  );
}
