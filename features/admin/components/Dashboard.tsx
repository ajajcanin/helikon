import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/server/db";

export async function Dashboard() {
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const [products, confirmed, variants, orders, newOrders, changes] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { confirmed: true } }),
    db.productVariant.count(),
    db.order.count(),
    db.order.count({ where: { status: "NEW" } }),
    db.auditLog.findMany({ orderBy: { id: "desc" }, take: 10 }),
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
      {changes.length === 0 ? (
        <p className="mt-3 font-ui text-sm text-[var(--text-muted)]">{t("noChanges")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--border-subtle)] font-ui text-sm">
          {changes.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>{c.summary ?? c.action}</span>
              <span className="text-[var(--text-muted)]">
                {c.userName} · {format.dateTime(c.at, "long")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
