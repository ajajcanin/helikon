import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { listHistory } from "../history";
import { HistoryList } from "./HistoryList";

export async function Dashboard() {
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const [products, confirmed, variants, orders, newOrders, changes] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { confirmed: true } }),
    db.productVariant.count(),
    db.order.count(),
    db.order.count({ where: { status: "NEW" } }),
    listHistory({ take: 10 }),
  ]);
  const stats = [
    [t("products"), products],
    [t("variants"), variants],
    [t("orders"), orders],
    [t("newOrders"), newOrders],
  ] as const;

  return (
    <>
      <h1 className="font-display text-2xl tracking-[0.08em]">{t("dashboard")}</h1>
      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="border border-[var(--border-subtle)] p-4">
            <dt className="font-ui text-xs text-[var(--text-muted)]">{label}</dt>
            <dd className="mt-1 font-display text-2xl">{format.number(value)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 font-ui text-sm text-[var(--text-secondary)]">
        {t("review")}: {t("reviewProgress", { done: confirmed, total: products })}
      </p>
      <h2 className="mt-10 font-display text-lg tracking-[0.08em]">{t("lastChanges")}</h2>
      {changes.rows.length === 0 ? (
        <p className="mt-3 font-ui text-sm text-[var(--text-muted)]">{t("noChanges")}</p>
      ) : (
        <HistoryList rows={changes.rows} className="mt-3 font-ui text-sm" />
      )}
    </>
  );
}
