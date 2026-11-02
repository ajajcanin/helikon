import { Decimal } from "decimal.js";
import { db } from "@/server/db";

/**
 * What a connector to an outside system (Pantheon, a POS) calls. The connector only fetches and sends data: rules for
 * applying it live here, so they are the same whichever way the system ends up being reached.
 */
export const PANTHEON = "pantheon";

export const isConnected = () => Boolean(process.env.PANTHEON_URL);

export type StockLevel = { sku: string; qty: number };
export type PriceLevel = { sku: string; price: string };
export type SaleRecord = {
  externalId: string;
  soldAt: Date;
  sku: string;
  name?: string;
  qty: number;
  revenue: string;
  cost?: string;
};
type Counts = { processed: number; failed: number };

/** Records one exchange: when it ran, how many rows it handled, and the error if it failed. */
export async function runSync(system: string, kind: string, work: (runId: number) => Promise<Counts>) {
  const run = await db.syncRun.create({ data: { system, kind } });
  try {
    const counts = await work(run.id);
    return await db.syncRun.update({
      where: { id: run.id },
      data: { status: "SUCCESS", finishedAt: new Date(), ...counts },
    });
  } catch (e) {
    return db.syncRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: e instanceof Error ? e.message.slice(0, 1000) : "Greška",
      },
    });
  }
}

/** Sets stock to the system's level. An unknown šifra counts as failed and doesn't stop the others. */
export async function applyStockLevels(levels: StockLevel[]): Promise<Counts> {
  let processed = 0;
  let failed = 0;
  for (const { sku, qty } of levels) {
    if (!Number.isInteger(qty) || qty < 0) {
      failed++;
      continue;
    }
    const done = await db.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: number; stock_qty: number }[]>`
        SELECT id, stock_qty FROM product_variant WHERE sku = ${sku} FOR UPDATE`;
      const variant = locked[0];
      if (!variant) return false;
      const delta = qty - variant.stock_qty;
      if (delta !== 0) {
        await tx.productVariant.update({ where: { id: variant.id }, data: { stockQty: qty } });
        await tx.stockMovement.create({ data: { variantId: variant.id, delta, reason: "SYNC" } });
      }
      return true;
    });
    if (done) processed++;
    else failed++;
  }
  return { processed, failed };
}

export async function applyPrices(prices: PriceLevel[]): Promise<Counts> {
  let processed = 0;
  let failed = 0;
  for (const { sku, price } of prices) {
    const valid = /^\d+(\.\d{1,2})?$/.test(price) && new Decimal(price).greaterThan(0);
    const { count } = valid
      ? await db.productVariant.updateMany({ where: { sku }, data: { price } })
      : { count: 0 };
    if (count > 0) processed++;
    else failed++;
  }
  return { processed, failed };
}

/** Store sales for analytics. Safe to send twice: a sale is matched by its id in the system. */
export async function recordExternalSales(
  system: string,
  runId: number,
  sales: SaleRecord[],
): Promise<Counts> {
  for (const s of sales) {
    const data = {
      soldAt: s.soldAt,
      sku: s.sku,
      name: s.name,
      qty: s.qty,
      revenue: s.revenue,
      cost: s.cost,
      syncRunId: runId,
    };
    await db.externalSale.upsert({
      where: { system_externalId: { system, externalId: s.externalId } },
      create: { system, externalId: s.externalId, ...data },
      update: data,
    });
  }
  return { processed: sales.length, failed: 0 };
}

/** Confirmed webshop orders the financial system doesn't have yet. */
export function ordersToExport() {
  return db.order.findMany({
    where: { exportedAt: null, status: { in: ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] } },
    orderBy: { id: "asc" },
    include: { lines: true },
  });
}

export const markOrderExported = (id: number, externalId: string) =>
  db.order.update({ where: { id }, data: { externalId, exportedAt: new Date() } });

export async function integrationStatus(system = PANTHEON) {
  const [runs, waiting] = await Promise.all([
    db.syncRun.findMany({ where: { system }, orderBy: { id: "desc" }, take: 20 }),
    db.order.count({
      where: { exportedAt: null, status: { in: ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] } },
    }),
  ]);
  return { connected: isConnected(), runs, waiting };
}
