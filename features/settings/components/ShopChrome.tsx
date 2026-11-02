import type { ReactNode } from "react";
import { SmearFilter } from "@/components/atoms/PaintSwatch";
import { ShopFooter } from "@/components/organisms/ShopFooter";
import { ShopHeader } from "@/components/organisms/ShopHeader";
import { getCompanySettings } from "@/server/company";
import { countPublishedArticles, listPublishedPages } from "@/server/content";
import { listCategoryTree } from "@/server/public/catalog";

/** Header and footer of every shop page, always in the dark theme. */
export async function ShopChrome({ children }: { children: ReactNode }) {
  const [tree, company, pages, articles] = await Promise.all([
    listCategoryTree(),
    getCompanySettings(),
    listPublishedPages(),
    countPublishedArticles(),
  ]);
  const categories = tree.map((c) => ({
    slug: c.slug,
    name: c.name,
    children: c.children.map((child) => ({ slug: child.slug, name: child.name })),
  }));
  const hasAbout = pages.some((p) => p.slug === "o-nama");
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page)] text-[var(--text-display)]">
      <SmearFilter />
      <ShopHeader categories={categories} hasJournal={articles > 0} hasAbout={hasAbout} />
      <main className="flex-1">{children}</main>
      <ShopFooter categories={categories} company={company} pages={pages} hasJournal={articles > 0} />
    </div>
  );
}
