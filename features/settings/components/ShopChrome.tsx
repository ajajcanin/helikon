import type { ReactNode } from "react";
import { SmearFilter } from "@/components/atoms/PaintSwatch";
import { ShopFooter } from "@/components/organisms/ShopFooter";
import { ShopHeader } from "@/components/organisms/ShopHeader";
import { getCompanySettings } from "@/server/company";
import { listCategoryTree } from "@/server/public/catalog";

/** Header and footer of every shop page, always in the dark theme. */
export async function ShopChrome({ children }: { children: ReactNode }) {
  const [tree, company] = await Promise.all([listCategoryTree(), getCompanySettings()]);
  const categories = tree.map((c) => ({ slug: c.slug, name: c.name }));
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page)] text-[var(--text-display)]">
      <SmearFilter />
      <ShopHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <ShopFooter categories={categories} company={company} />
    </div>
  );
}
