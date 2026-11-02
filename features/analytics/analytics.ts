import { Decimal } from "decimal.js";
import { db } from "@/server/db";

const LOW_STOCK = 3;
const ZONE = "Europe/Sarajevo";

export type DayRevenue = { day: string; revenue: number };

/** Sales for the last `days` days, in Sarajevo time. Cancelled and returned orders don't count. */
export async function getAnalytics(days: number, now = new Date()) {
  const since = new Date(now.getTime() - days * 86_400_000);
  const [totals, daily, external, top, stock] = await Promise.all([
    db.$queryRaw<{ revenue: Decimal | null; orders: bigint; items: bigint | null }[]>`
      SELECT sum(o.total) AS revenue, count(*) AS orders,
             (SELECT sum(l.qty) FROM order_line l JOIN "order" x ON x.id = l.order_id
               WHERE x.created_at >= ${since} AND x.status NOT IN ('CANCELLED', 'RETURNED')) AS items
        FROM "order" o
       WHERE o.created_at >= ${since} AND o.status NOT IN ('CANCELLED', 'RETURNED')`,
    db.$queryRaw<{ day: string; revenue: Decimal }[]>`
      SELECT to_char((d.at AT TIME ZONE 'UTC') AT TIME ZONE ${ZONE}, 'YYYY-MM-DD') AS day, sum(d.revenue) AS revenue
        FROM (
          SELECT created_at AS at, total AS revenue FROM "order"
           WHERE created_at >= ${since} AND status NOT IN ('CANCELLED', 'RETURNED')
          UNION ALL
          SELECT sold_at, revenue FROM external_sale WHERE sold_at >= ${since}
        ) d
       GROUP BY 1 ORDER BY 1`,
    db.externalSale.aggregate({ where: { soldAt: { gte: since } }, _sum: { revenue: true } }),
    db.$queryRaw<{ sku: string; name: string; qty: bigint; revenue: Decimal }[]>`
      SELECT s.sku, max(s.name) AS name, sum(s.qty) AS qty, sum(s.revenue) AS revenue
        FROM (
          SELECT l.sku, l.name, l.qty, l.line_total AS revenue
            FROM order_line l JOIN "order" o ON o.id = l.order_id
           WHERE o.created_at >= ${since} AND o.status NOT IN ('CANCELLED', 'RETURNED')
          UNION ALL
          SELECT sku, coalesce(name, sku), qty, revenue FROM external_sale WHERE sold_at >= ${since}
        ) s
       GROUP BY s.sku ORDER BY revenue DESC, s.sku LIMIT 10`,
    db.$queryRaw<{ units: bigint; retail: Decimal; cost: Decimal; out: bigint; low: bigint }[]>`
      SELECT coalesce(sum(v.stock_qty), 0) AS units,
             coalesce(sum(v.stock_qty * v.price), 0) AS retail,
             coalesce(sum(v.stock_qty * c.purchase_km), 0) AS cost,
             count(*) FILTER (WHERE v.stock_qty = 0) AS out,
             count(*) FILTER (WHERE v.stock_qty > 0 AND v.stock_qty <= ${LOW_STOCK}) AS low
        FROM product_variant v LEFT JOIN variant_cost c ON c.variant_id = v.id
       WHERE v.active`,
  ]);

  const web = Number(totals[0]?.revenue ?? 0);
  const orders = Number(totals[0]?.orders ?? 0);
  const byDay = new Map(daily.map((d) => [d.day, Number(d.revenue)]));
  const format = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE });
  const series: DayRevenue[] = Array.from({ length: days }, (_, i) => {
    const day = format.format(new Date(now.getTime() - (days - 1 - i) * 86_400_000));
    return { day, revenue: byDay.get(day) ?? 0 };
  });

  return {
    revenue: web + Number(external._sum.revenue ?? 0),
    web,
    external: Number(external._sum.revenue ?? 0),
    orders,
    average: orders ? new Decimal(web).dividedBy(orders).toDecimalPlaces(2).toNumber() : 0,
    items: Number(totals[0]?.items ?? 0),
    series,
    top: top.map((t) => ({ sku: t.sku, name: t.name, qty: Number(t.qty), revenue: Number(t.revenue) })),
    stock: {
      units: Number(stock[0]?.units ?? 0),
      retail: Number(stock[0]?.retail ?? 0),
      cost: Number(stock[0]?.cost ?? 0),
      out: Number(stock[0]?.out ?? 0),
      low: Number(stock[0]?.low ?? 0),
    },
  };
}
