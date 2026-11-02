import { getFormatter, getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { getAnalytics } from "@/features/analytics/analytics";
import { RevenueChart } from "@/features/analytics/components/RevenueChart";
import { Link } from "@/i18n/navigation";
import { km } from "@/lib/money";
import { param, type SearchParams } from "@/lib/search-params";
import { requirePageUser } from "@/server/admin/session";

const RANGES = [7, 30, 90] as const;

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--border-subtle)] p-4">
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePageUser();
  const sp = await searchParams;
  const asked = Number(param(sp.dana));
  const days = RANGES.find((r) => r === asked) ?? 30;
  const [data, t, format] = await Promise.all([
    getAnalytics(days),
    getTranslations("analytics"),
    getFormatter(),
  ]);
  const count = (value: number) => format.number(value);
  const series = data.series.map((d) => ({
    ...d,
    label: format.dateTime(new Date(`${d.day}T12:00:00`), "short"),
    value: km(d.revenue),
  }));
  const sold = series.filter((d) => d.revenue > 0);
  const heading = "mt-8 mb-3 font-display text-base tracking-[0.04em]";
  const th = "py-2 pr-3 font-normal";
  return (
    <>
      <PageTitle intro={t("intro")}>{t("title")}</PageTitle>
      <nav className="mb-4 flex flex-wrap gap-4">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={{ pathname: "/admin/analitika", query: { dana: r } }}
            aria-current={r === days ? "page" : undefined}
            className={
              r === days
                ? "text-[var(--accent-bright)] underline underline-offset-4"
                : "text-[var(--text-secondary)]"
            }
          >
            {t("days", { days: r })}
          </Link>
        ))}
      </nav>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label={t("revenue")} value={km(data.revenue)} />
        <Tile label={t("orders")} value={count(data.orders)} />
        <Tile label={t("average")} value={km(data.average)} />
        <Tile label={t("items")} value={count(data.items)} />
      </dl>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{t("excluded")}</p>

      <h2 className={heading}>{t("chartTitle")}</h2>
      {sold.length === 0 ? (
        <p className="text-[var(--text-muted)]">{t("noSales")}</p>
      ) : (
        <>
          <RevenueChart series={series} title={t("chartTitle")} formatKm={km(data.revenue)} />
          <details className="mt-3">
            <summary className="cursor-pointer text-[var(--accent-bright)]">{t("tableView")}</summary>
            <table className="mt-2 border-collapse text-left">
              <thead className="text-xs text-[var(--text-muted)]">
                <tr>
                  <th className={th}>{t("day")}</th>
                  <th className={th}>{t("revenue")}</th>
                </tr>
              </thead>
              <tbody>
                {sold.map((d) => (
                  <tr key={d.day}>
                    <td className="py-1 pr-6">{d.label}</td>
                    <td className="py-1">{d.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}

      <h2 className={heading}>{t("channels")}</h2>
      <dl className="grid max-w-xl grid-cols-2 gap-4">
        <Tile label={t("channelWeb")} value={km(data.web)} />
        <Tile label={t("channelExternal")} value={km(data.external)} />
      </dl>

      <h2 className={heading}>{t("top")}</h2>
      {data.top.length === 0 ? (
        <p className="text-[var(--text-muted)]">{t("noSales")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left">
            <thead className="text-xs text-[var(--text-muted)]">
              <tr className="border-b border-[var(--border-strong)]">
                <th className={th}>{t("top")}</th>
                <th className={`${th} text-right`}>{t("qty")}</th>
                <th className="py-2 text-right font-normal">{t("revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((p) => (
                <tr key={p.sku} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2 pr-3">{p.name}</td>
                  <td className="py-2 pr-3 text-right">{count(p.qty)}</td>
                  <td className="py-2 text-right">{km(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className={heading}>{t("stock")}</h2>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label={t("stockUnits")} value={count(data.stock.units)} />
        <Tile label={t("stockRetail")} value={km(data.stock.retail)} />
        {/* Purchase prices are for administrators only. */}
        {user.role === "ADMINISTRATOR" && <Tile label={t("stockCost")} value={km(data.stock.cost)} />}
        <Tile label={t("outOfStock")} value={count(data.stock.out)} />
        <Tile label={t("lowStock")} value={count(data.stock.low)} />
      </dl>
    </>
  );
}
