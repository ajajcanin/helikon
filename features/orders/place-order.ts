import { Decimal } from "decimal.js";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { nextNumber } from "@/server/numbers";
import { computeTotals } from "./totals";

export const placeOrderSchema = z.object({
  checkoutKey: z.string().min(16).max(64),
  customerName: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z.string().trim().min(6).max(30),
  address: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(10),
  customerNote: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "BANK_TRANSFER"]),
  deliveryRateId: z.number().int().positive(),
  /** The total the customer saw. If the price changed since, the order stops and they see the new one. */
  expectedTotal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  lines: z
    .array(z.object({ variantId: z.number().int().positive(), qty: z.number().int().min(1).max(999) }))
    .min(1)
    .max(100),
});

export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

export type PlaceOrderError = "out_of_stock" | "unavailable" | "price_changed" | "delivery_unavailable";

export class OrderError extends Error {
  constructor(
    readonly code: PlaceOrderError,
    readonly variantIds: number[] = [],
  ) {
    super(code);
    this.name = "OrderError";
  }
}

/**
 * Checkout's last step, all in one transaction: re-read prices, take the stock, freeze the lines.
 * Nothing the browser says about price or stock is trusted. Any failure leaves stock and numbering untouched.
 */
export async function placeOrder(raw: PlaceOrderInput) {
  const input = placeOrderSchema.parse(raw);

  const existing = await db.order.findUnique({ where: { checkoutKey: input.checkoutKey } });
  if (existing) return existing;

  // Same variant twice becomes one line. Sorted so two orders always lock rows in the same order and can't deadlock.
  const wanted = new Map<number, number>();
  for (const l of input.lines) wanted.set(l.variantId, (wanted.get(l.variantId) ?? 0) + l.qty);
  const ids = [...wanted.keys()].sort((a, b) => a - b);

  try {
    return await db.$transaction(async (tx) => {
      const rate = await tx.deliveryRate.findFirst({ where: { id: input.deliveryRateId, active: true } });
      if (!rate) throw new OrderError("delivery_unavailable");

      const variants = await tx.productVariant.findMany({
        where: { id: { in: ids }, active: true, product: { status: "PUBLISHED" } },
        select: {
          id: true,
          sku: true,
          size: true,
          price: true,
          taxRate: true,
          product: { select: { name: true } },
        },
      });
      const missing = ids.filter((id) => !variants.some((v) => v.id === id));
      if (missing.length) throw new OrderError("unavailable", missing);

      const short: number[] = [];
      for (const id of ids) {
        const qty = wanted.get(id)!;
        // The stock check and the decrement are one statement, so two buyers can't take the same last unit.
        const { count } = await tx.productVariant.updateMany({
          where: { id, stockQty: { gte: qty } },
          data: { stockQty: { decrement: qty } },
        });
        if (count === 0) short.push(id);
      }
      if (short.length) throw new OrderError("out_of_stock", short);

      const sorted = ids.map((id) => variants.find((v) => v.id === id)!);
      const totals = computeTotals(
        sorted.map((v) => ({
          unitPrice: v.price.toString(),
          qty: wanted.get(v.id)!,
          taxRate: v.taxRate.toString(),
        })),
        { price: rate.price.toString(), freeFrom: rate.freeFrom?.toString() },
      );
      if (!totals.total.equals(new Decimal(input.expectedTotal))) throw new OrderError("price_changed");

      const order = await tx.order.create({
        data: {
          number: await nextNumber(tx, "order"),
          checkoutKey: input.checkoutKey,
          paymentMethod: input.paymentMethod,
          customerName: input.customerName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          address: input.address,
          city: input.city,
          postalCode: input.postalCode,
          customerNote: input.customerNote || null,
          deliveryRateId: rate.id,
          deliveryName: rate.name,
          subtotal: totals.subtotal.toString(),
          deliveryPrice: totals.deliveryPrice.toString(),
          taxTotal: totals.taxTotal.toString(),
          total: totals.total.toString(),
          lines: {
            create: sorted.map((v, i) => ({
              variantId: v.id,
              sku: v.sku,
              name: v.product.name,
              size: v.size,
              unitPrice: v.price,
              taxRate: v.taxRate,
              qty: wanted.get(v.id)!,
              lineTotal: totals.lineTotals[i]!.toString(),
            })),
          },
          events: { create: { toStatus: "NEW" } },
        },
      });
      await tx.stockMovement.createMany({
        data: ids.map((id) => ({
          variantId: id,
          delta: -wanted.get(id)!,
          reason: "ORDER" as const,
          orderId: order.id,
        })),
      });
      return order;
    });
  } catch (e) {
    // A double click that raced past the first check: the other request created the order.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const order = await db.order.findUnique({ where: { checkoutKey: input.checkoutKey } });
      if (order) return order;
    }
    throw e;
  }
}
