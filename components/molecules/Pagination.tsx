import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = { pathname: string; page: number; pages: number; query: Record<string, string> };

export function Pagination({ pathname, page, pages, query }: Props) {
  const t = useTranslations("common");
  if (pages <= 1) return null;
  const to = (strana: number) => ({ pathname, query: { ...query, strana } });
  return (
    <nav className="mt-6 flex items-center justify-between font-ui text-sm">
      {page > 1 ? <Link href={to(page - 1)}>{t("previous")}</Link> : <span />}
      <span className="text-[var(--text-muted)]">{t("page", { page, pages })}</span>
      {page < pages ? <Link href={to(page + 1)}>{t("next")}</Link> : <span />}
    </nav>
  );
}
