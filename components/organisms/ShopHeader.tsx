"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";

type Category = { slug: string; name: string };

export function ShopHeader({ categories }: { categories: Category[] }) {
  const t = useTranslations("shop");
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // The cart lives in the browser, so its count appears only after loading, keeping server and browser HTML equal.
  useEffect(() => setMounted(true), []);
  const link =
    "whitespace-nowrap font-ui text-[11px] uppercase tracking-[0.13em] text-[var(--text-secondary)] hover:text-[var(--accent-bright)]";
  const icon =
    "inline-flex h-10 items-center justify-center gap-2 border border-[var(--border-subtle)] px-2.5 text-[var(--text-secondary)] hover:border-[var(--border-brass)] hover:text-[var(--accent-bright)]";
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-well)]">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-4 px-6">
        <button
          type="button"
          aria-label={t("menu")}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="lg:hidden"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
        <Link href="/" className="flex items-center gap-3" aria-label={t("home")}>
          {/* biome-ignore lint/performance/noImgElement: a small SVG that needs no optimisation */}
          <img src="/images/star-gold.svg" alt="" width={26} height={36} />
          <span className="font-display text-[20px] font-semibold tracking-[0.16em] text-[var(--text-display)]">
            HELIKON
          </span>
        </Link>
        <form action="/pretraga" className="ml-auto hidden max-w-xs flex-1 md:block">
          <input
            name="q"
            type="search"
            aria-label={t("search")}
            placeholder={t("searchHint")}
            className="h-10 w-full rounded-[2px] border border-[var(--border-subtle)] bg-transparent px-3 font-ui text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          />
        </form>
        <Link href="/pretraga" aria-label={t("search")} className={`${icon} ml-auto md:hidden`}>
          <Icon name="search" />
        </Link>
        <Link href="/korpa" className={icon}>
          <Icon name="cart" />
          <span className="font-ui text-[13px]">{t("cart")}</span>
          {mounted && count > 0 && (
            <span className="min-w-[18px] rounded-full bg-[var(--accent)] px-1.5 text-center font-ui text-[11px] leading-[18px] font-semibold text-[var(--text-on-accent)]">
              {count}
            </span>
          )}
        </Link>
      </div>
      <nav
        aria-label={t("nav")}
        className="mx-auto hidden max-w-[1200px] flex-wrap gap-x-5 gap-y-1 px-6 pb-3 lg:flex"
      >
        {categories.map((c) => (
          <Link key={c.slug} href={`/kategorija/${c.slug}`} className={link}>
            {c.name}
          </Link>
        ))}
        <Link href="/kontakt" className={`${link} ml-auto`}>
          {t("contactShort")}
        </Link>
      </nav>
      {open && (
        <nav
          aria-label={t("nav")}
          className="flex flex-col gap-3.5 border-t border-[var(--border-subtle)] px-6 py-5 lg:hidden"
        >
          {categories.map((c) => (
            <Link key={c.slug} href={`/kategorija/${c.slug}`} onClick={() => setOpen(false)} className={link}>
              {c.name}
            </Link>
          ))}
          <Link href="/kontakt" onClick={() => setOpen(false)} className={link}>
            {t("contact")}
          </Link>
        </nav>
      )}
    </header>
  );
}
