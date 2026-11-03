import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { param, type SearchParams } from "@/lib/search-params";
import { getCompanySettings } from "@/server/company";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Reads the address, so it can never be a single cached page. */
export const dynamic = "force-dynamic";

/** Shows only what's in the address: no order data is read, so nobody can look up an order by guessing a number. */
export default async function ThanksPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const number = param(sp.broj).slice(0, 20);
  const [t, company] = await Promise.all([getTranslations("shop"), getCompanySettings()]);
  return (
    <div className="mx-auto max-w-[720px] px-6 pt-16 pb-[88px] text-center">
      <span className="hk-eyebrow">{t("thanksEyebrow")}</span>
      <h1 className="mt-3 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] md:text-[42px]">
        {t("thanksTitle")}
      </h1>
      {number && (
        <p className="mt-5 font-ui text-sm tracking-[0.1em] text-[var(--accent-bright)]">
          {t("thanksNumber", { number })}
        </p>
      )}
      <p className="mt-4 font-body text-lg text-[var(--text-secondary)]">{t("thanksText")}</p>
      {param(sp.placanje) === "virman" && company.bankAccount && (
        <p className="mt-4 font-body text-lg text-[var(--text-display)]">
          {t("thanksBank", { account: company.bankAccount, number })}
        </p>
      )}
      <Link
        href="/"
        className="mt-8 inline-block font-ui text-sm text-[var(--accent-bright)] underline underline-offset-4"
      >
        {t("thanksBack")}
      </Link>
    </div>
  );
}
