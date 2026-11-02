import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
  categories: { slug: string; name: string }[];
  company: { legalName: string; address: string; city: string; phone: string; email: string };
  /** Content pages that have text */
  pages: { slug: string; title: string }[];
  hasJournal: boolean;
};

export function ShopFooter({ categories, company, pages, hasJournal }: Props) {
  const t = useTranslations("shop");
  const heading = "mb-3.5 font-ui text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]";
  const link = "font-body text-base text-[var(--text-secondary)] hover:text-[var(--accent-bright)]";
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-well)]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 pt-14 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="font-display text-[22px] font-semibold tracking-[0.16em] text-[var(--text-display)]">
            HELIKON
          </span>
          <p className="mt-4 max-w-[40ch] font-body text-base leading-relaxed text-[var(--text-secondary)]">
            {t("footerText")}
          </p>
        </div>
        <div>
          <p className={heading}>{t("footerShop")}</p>
          <ul className="flex flex-col gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/kategorija/${c.slug}`} className={link}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={heading}>{t("footerHouse")}</p>
          <address className="flex flex-col gap-1 font-body text-base text-[var(--text-secondary)] not-italic">
            <span>{company.address}</span>
            <span>{company.city}</span>
            <a href={`tel:${company.phone.replace(/\s/g, "")}`} className={link}>
              {company.phone}
            </a>
            <a href={`mailto:${company.email}`} className={link}>
              {company.email}
            </a>
          </address>
          <Link href="/kontakt" className={`${link} mt-3 block`}>
            {t("contact")}
          </Link>
          {hasJournal && (
            <Link href="/dnevnik" className={`${link} block`}>
              {t("journal")}
            </Link>
          )}
          {pages.map((page) => (
            <Link key={page.slug} href={`/${page.slug}`} className={`${link} block`}>
              {page.title}
            </Link>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-6">
        <hr className="hk-rule" />
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-4 px-6 pt-5 pb-10 font-ui text-xs tracking-[0.08em] text-[var(--text-muted)]">
        <span>© {company.legalName}</span>
        <span className="tracking-[0.2em] uppercase">{t("motto")}</span>
      </div>
    </footer>
  );
}
