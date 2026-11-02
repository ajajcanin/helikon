import { getFormatter, getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { integrationStatus } from "@/features/integrations/sync";

export default async function IntegrationsPage() {
  const [data, t, format] = await Promise.all([
    integrationStatus(),
    getTranslations("integrations"),
    getFormatter(),
  ]);
  const flows = [
    ["fItems", "fromPantheon", "ownerPantheon"],
    ["fPrices", "fromPantheon", "ownerPantheon"],
    ["fStock", "fromPantheon", "ownerPantheon"],
    ["fSales", "fromPantheon", "ownerPantheon"],
    ["fOrders", "toPantheon", "ownerShop"],
    ["fContent", "local", "ownerShop"],
  ] as const;
  const heading = "mt-8 mb-2 font-display text-base tracking-[0.04em]";
  const th = "py-2 pr-3 font-normal";
  return (
    <>
      <PageTitle intro={t("intro")}>{t("title")}</PageTitle>
      <p>
        {t("status")}:{" "}
        <span className={data.connected ? "text-[var(--accent-bright)]" : "text-[var(--text-muted)]"}>
          {data.connected ? t("connected") : t("notConnected")}
        </span>
      </p>
      <p className="mt-1 text-[var(--text-secondary)]">
        {t("waiting")}: {data.waiting}
      </p>
      <h2 className={heading}>{t("flowTitle")}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead className="text-xs text-[var(--text-muted)]">
            <tr className="border-b border-[var(--border-strong)]">
              <th className={th}>{t("data")}</th>
              <th className={th}>{t("direction")}</th>
              <th className={th}>{t("owner")}</th>
            </tr>
          </thead>
          <tbody>
            {flows.map(([name, direction, owner]) => (
              <tr key={name} className="border-b border-[var(--border-subtle)]">
                <td className="py-2 pr-3">{t(name)}</td>
                <td className="py-2 pr-3 text-[var(--text-secondary)]">{t(direction)}</td>
                <td className="py-2 pr-3 text-[var(--text-secondary)]">{t(owner)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className={heading}>{t("runsTitle")}</h2>
      {data.runs.length === 0 ? (
        <p className="text-[var(--text-muted)]">{t("noRuns")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead className="text-xs text-[var(--text-muted)]">
              <tr className="border-b border-[var(--border-strong)]">
                <th className={th}>{t("started")}</th>
                <th className={th}>{t("kind")}</th>
                <th className={th}>{t("status")}</th>
                <th className={th}>{t("processed")}</th>
                <th className={th}>{t("failed")}</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2 pr-3">{format.dateTime(r.startedAt, "long")}</td>
                  <td className="py-2 pr-3">{r.kind}</td>
                  <td className="py-2 pr-3">{t(r.status)}</td>
                  <td className="py-2 pr-3">{r.processed}</td>
                  <td className="py-2 pr-3">{r.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
