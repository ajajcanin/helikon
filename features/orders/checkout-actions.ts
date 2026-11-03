"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { logger } from "@/server/logger";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { refreshShop } from "@/server/shop-cache";
import { verifyTurnstile } from "@/server/turnstile";
import { sendOrderEmails } from "./notify";
import { OrderError, orderRefreshTags, placeOrder, placeOrderSchema } from "./place-order";
import { computeTotals } from "./totals";

const cartSchema = z
  .array(z.object({ variantId: z.number().int().positive(), qty: z.number().int().min(1).max(999) }))
  .max(100);

/** Current names, prices and stock for what's in the browser's cart. The browser is never trusted for these. */
export async function readCart(rawLines: unknown, deliveryRateId?: number) {
  const parsed = cartSchema.safeParse(rawLines);
  if (!parsed.success) return { lines: [], total: "0", subtotal: "0", deliveryPrice: "0" };
  const variants = await db.productVariant.findMany({
    where: { id: { in: parsed.data.map((l) => l.variantId) } },
    select: {
      id: true,
      sku: true,
      size: true,
      price: true,
      taxRate: true,
      stockQty: true,
      active: true,
      product: {
        select: {
          slug: true,
          name: true,
          status: true,
          colourName: true,
          colourNameMaker: true,
          colourFamily: true,
        },
      },
    },
  });
  const lines = parsed.data.flatMap((line) => {
    const v = variants.find((x) => x.id === line.variantId);
    if (!v) return [];
    return {
      variantId: v.id,
      qty: line.qty,
      sku: v.sku,
      size: v.size,
      slug: v.product.slug,
      name: v.product.name,
      colourName: v.product.colourName,
      colourNameMaker: v.product.colourNameMaker,
      colourFamily: v.product.colourFamily,
      unitPrice: v.price.toFixed(2),
      taxRate: v.taxRate.toString(),
      stockQty: v.stockQty,
      available: v.active && v.product.status === "PUBLISHED",
    };
  });
  const sellable = lines.filter((l) => l.available);
  const rate = deliveryRateId
    ? await db.deliveryRate.findFirst({ where: { id: deliveryRateId, active: true } })
    : null;
  const totals = computeTotals(
    sellable.map((l) => ({ unitPrice: l.unitPrice, qty: l.qty, taxRate: l.taxRate })),
    { price: rate?.price.toString() ?? "0", freeFrom: rate?.freeFrom?.toString() },
  );
  return {
    lines: lines.map(({ taxRate: _tax, ...line }) => line),
    subtotal: totals.subtotal.toFixed(2),
    deliveryPrice: totals.deliveryPrice.toFixed(2),
    total: totals.total.toFixed(2),
  };
}

export type SubmitError =
  | "out_of_stock"
  | "unavailable"
  | "price_changed"
  | "delivery_unavailable"
  | "invalid"
  | "captcha"
  | "rate_limited"
  | "generic";
export type SubmitResult = { ok: true; number: string } | { ok: false; error: SubmitError };

export async function submitOrder(raw: unknown, turnstileToken: string): Promise<SubmitResult> {
  const input = placeOrderSchema.safeParse(raw);
  if (!input.success) return { ok: false, error: "invalid" };
  if (!(await verifyTurnstile(turnstileToken))) return { ok: false, error: "captcha" };
  if (!(await rateLimit(`checkout:${clientIp(await headers())}`, 10, 60 * 60 * 1000)))
    return { ok: false, error: "rate_limited" };
  try {
    const order = await placeOrder(input.data);
    // Stock changed. A failure here must not look like a failed order: the page catches up within the hour.
    try {
      refreshShop(await orderRefreshTags(order.id));
    } catch (err) {
      logger.error({ err, order: order.id }, "order page refresh failed");
    }
    // After the answer, so a slow or failing mail service can't hold up or undo an order.
    after(() =>
      sendOrderEmails(order.id).catch((err) => logger.error({ err, order: order.id }, "order e-mail failed")),
    );
    return { ok: true, number: order.number };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.code };
    logger.error({ err: e }, "order failed");
    return { ok: false, error: "generic" };
  }
}
