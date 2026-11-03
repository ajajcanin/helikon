import { getTranslations } from "next-intl/server";
import { cachedCompany } from "@/server/public/cached";

export const revalidate = 3600;

export default async function ContactPage() {
  const [t, company] = await Promise.all([getTranslations("shop"), cachedCompany()]);
  const heading = "mb-3 font-ui text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]";
  const hours = company.openingHours.split("\n").filter(Boolean);
  const query = encodeURIComponent(company.mapQuery);
  return (
    <div className="mx-auto max-w-[1000px] px-6 pt-12 pb-[88px]">
      <span className="hk-eyebrow">{t("contactEyebrow")}</span>
      <h1 className="mt-2.5 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] uppercase md:text-[42px]">
        {t("contactTitle")}
      </h1>
      <p className="mt-3 mb-10 max-w-[60ch] font-body text-[19px] leading-relaxed text-[var(--text-secondary)]">
        {t("contactText")}
      </p>
      <div className="grid gap-8 border-t border-[var(--border-subtle)] pt-8 md:grid-cols-3">
        <div>
          <h2 className={heading}>{t("contactAddress")}</h2>
          <address className="font-body text-lg not-italic">
            {company.legalName}
            <br />
            {company.address}
            <br />
            {company.city}
          </address>
        </div>
        {hours.length > 0 && (
          <div>
            <h2 className={heading}>{t("contactHours")}</h2>
            {hours.map((line) => (
              <p key={line} className="font-body text-lg">
                {line}
              </p>
            ))}
          </div>
        )}
        <div>
          <h2 className={heading}>{t("contactDirect")}</h2>
          <p className="font-body text-lg">
            <a href={`tel:${company.phone.replace(/\s/g, "")}`}>{company.phone}</a>
          </p>
          <p className="font-body text-lg">
            <a href={`mailto:${company.email}`} className="text-[var(--accent-bright)]">
              {company.email}
            </a>
          </p>
        </div>
      </div>
      {company.mapQuery && (
        <section className="mt-10">
          <iframe
            title={t("mapTitle")}
            src={`https://www.google.com/maps?q=${query}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[420px] w-full border border-[var(--border-subtle)] max-md:h-[320px]"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-[2px] bg-[var(--accent)] px-6 font-ui text-sm font-semibold tracking-[0.08em] text-[var(--text-on-accent)] hover:bg-[var(--accent-bright)]"
            >
              {t("directions")}
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${query}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-[2px] border border-[var(--border-brass)] px-6 font-ui text-sm tracking-[0.08em] text-[var(--accent-bright)] hover:border-[var(--accent)]"
            >
              {t("openInMaps")}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
