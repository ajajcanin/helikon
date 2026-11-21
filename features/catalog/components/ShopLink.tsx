import { useTranslations } from "next-intl";

/**
 * Opens the product's page in the shop in a new tab, to see it as customers do. Only a published product has one,
 * so otherwise it says the product isn't on the web.
 */
export function ShopLink({ slug, status, className }: { slug: string; status: string; className?: string }) {
  const t = useTranslations("products");
  if (status !== "PUBLISHED")
    return (
      <span className={`font-ui text-xs text-[var(--text-muted)] ${className ?? ""}`}>{t("notOnWeb")}</span>
    );
  return (
    <a
      href={`/proizvod/${slug}`}
      target="_blank"
      rel="noreferrer"
      className={`font-ui text-xs text-[var(--accent-bright)] underline underline-offset-2 ${className ?? ""}`}
    >
      {t("showOnWeb")}
    </a>
  );
}
