"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { Link, usePathname } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";

type Category = { slug: string; name: string; children: { slug: string; name: string }[] };
type Props = { categories: Category[]; hasJournal: boolean; hasAbout: boolean };

const LINK =
  "whitespace-nowrap font-ui text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--accent-bright)]";

export function ShopHeader({ categories, hasJournal, hasAbout }: Props) {
  const t = useTranslations("shop");
  const { count } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Leaves the large menu when a link in it was followed, even while the pointer is still over it.
  const [closedFor, setClosedFor] = useState<string | null>(null);
  // The cart lives in the browser, so its count appears only after loading, keeping server and browser HTML equal.
  useEffect(() => setMounted(true), []);
  const icon =
    "inline-flex h-10 items-center justify-center gap-2 border border-[var(--border-subtle)] px-2.5 text-[var(--text-secondary)] hover:border-[var(--border-brass)] hover:text-[var(--accent-bright)]";
  const extras = [
    ...(hasJournal ? [{ href: "/dnevnik", label: t("journal") }] : []),
    ...(hasAbout ? [{ href: "/o-nama", label: t("about") }] : []),
    { href: "/kontakt", label: t("contactShort") },
  ];
  const hideMega = closedFor === pathname;
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-well)]">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-6 px-6">
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
        <nav aria-label={t("nav")} className="hidden h-full items-center gap-6 lg:flex">
          {/* Hovering or tabbing to Proizvodi opens the menu. Clicking it goes to all products. */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: only resets the menu, which keyboard users close by moving on */}
          <div className="group flex h-full items-center" onMouseLeave={() => setClosedFor(null)}>
            <Link href="/proizvodi" onClick={() => setClosedFor("/proizvodi")} className={LINK}>
              {t("products")}
            </Link>
            {!hideMega && (
              <div className="invisible absolute inset-x-0 top-full border-b border-[var(--border-subtle)] bg-[var(--bg-well)] opacity-0 transition-opacity duration-150 group-has-[:focus-visible]:visible group-has-[:focus-visible]:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="mx-auto grid max-w-[1200px] grid-cols-4 gap-x-8 gap-y-7 px-6 py-8">
                  {categories.map((category) => (
                    <div key={category.slug}>
                      <Link
                        href={`/kategorija/${category.slug}`}
                        onClick={() => setClosedFor(`/kategorija/${category.slug}`)}
                        className="font-display text-[15px] tracking-[0.08em] text-[var(--text-display)] uppercase hover:text-[var(--accent-bright)]"
                      >
                        {category.name}
                      </Link>
                      <ul className="mt-2.5 flex flex-col gap-1.5">
                        {category.children.map((child) => (
                          <li key={child.slug}>
                            <Link
                              href={`/kategorija/${child.slug}`}
                              onClick={() => setClosedFor(`/kategorija/${child.slug}`)}
                              className="font-body text-[15px] text-[var(--text-secondary)] hover:text-[var(--accent-bright)]"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/kategorija/boje" className={LINK}>
            {t("paints")}
          </Link>
          {extras.map((item) => (
            <Link key={item.href} href={item.href} className={LINK}>
              {item.label}
            </Link>
          ))}
        </nav>
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
      {open && (
        <nav
          aria-label={t("nav")}
          className="max-h-[calc(100vh-68px)] overflow-y-auto border-t border-[var(--border-subtle)] px-6 py-5 lg:hidden"
        >
          <Link
            href="/proizvodi"
            onClick={() => setOpen(false)}
            className={`${LINK} block py-1.5 text-[var(--accent-bright)]`}
          >
            {t("allProducts")}
          </Link>
          {categories.map((category) => (
            <details key={category.slug} className="border-t border-[var(--border-subtle)] py-2.5">
              <summary className={`${LINK} cursor-pointer list-none`}>{category.name}</summary>
              <div className="mt-2 flex flex-col gap-2 pl-3">
                <Link
                  href={`/kategorija/${category.slug}`}
                  onClick={() => setOpen(false)}
                  className="font-body text-base text-[var(--accent-bright)]"
                >
                  {t("allCategoriesLink")}
                </Link>
                {category.children.map((child) => (
                  <Link
                    key={child.slug}
                    href={`/kategorija/${child.slug}`}
                    onClick={() => setOpen(false)}
                    className="font-body text-base text-[var(--text-secondary)]"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </details>
          ))}
          <div className="mt-1 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-3.5">
            {extras.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={LINK}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
