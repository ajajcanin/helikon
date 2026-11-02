import { getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { HomeForm, PageForm } from "@/features/content/components/ContentForms";
import { FeaturedPicker } from "@/features/content/components/FeaturedPicker";
import { listFeaturedRows } from "@/features/content/featured";
import { requirePageUser } from "@/server/admin/session";
import { CONTENT_PAGES, getHomeContent, getPageContent } from "@/server/content";

export default async function ContentPage() {
  const [user, featured, t, home, pages] = await Promise.all([
    requirePageUser(),
    listFeaturedRows(),
    getTranslations("content"),
    getHomeContent(),
    Promise.all(CONTENT_PAGES.map(async (p) => ({ ...p, content: await getPageContent(p.slug) }))),
  ]);
  return (
    <>
      <PageTitle intro={t("intro")}>{t("title")}</PageTitle>
      <h2 className="font-display text-lg tracking-[0.06em]">{t("home")}</h2>
      <HomeForm initial={home} />
      <FeaturedPicker initial={featured} canUseProfit={user.role === "ADMINISTRATOR"} />
      <h2 className="mt-10 mb-1 font-display text-lg tracking-[0.06em]">{t("pages")}</h2>
      <p className="mb-4 font-ui text-sm text-[var(--text-secondary)]">{t("pagesHint")}</p>
      <div className="flex flex-col gap-4">
        {pages.map((p) => (
          <PageForm
            key={p.slug}
            slug={p.slug}
            label={p.label}
            title={p.content.title ?? ""}
            body={p.content.body ?? ""}
          />
        ))}
      </div>
    </>
  );
}
