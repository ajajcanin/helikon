import { getTranslations } from "next-intl/server";
import { ArticleForm } from "@/features/content/components/ArticleForm";
import { knownTags } from "@/features/content/content";
import { Link } from "@/i18n/navigation";

export default async function NewArticlePage() {
  const [t, c, tags] = await Promise.all([
    getTranslations("content"),
    getTranslations("common"),
    knownTags(),
  ]);
  return (
    <>
      <Link
        href="/admin/dnevnik"
        className="mb-4 inline-block text-[var(--accent-bright)] underline underline-offset-2"
      >
        {c("back")}
      </Link>
      <h1 className="mb-5 font-display text-2xl tracking-[0.06em]">{t("newArticle")}</h1>
      <ArticleForm knownTags={tags} />
    </>
  );
}
