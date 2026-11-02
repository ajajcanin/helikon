import { randomUUID } from "node:crypto";
import { db } from "@/server/db";

/** Empties everything except the append-only audit log, which no test may rely on being empty. */
export async function resetDb() {
  await db.$executeRaw`TRUNCATE stock_movement, order_event, order_line, document, "order", delivery_rate, variant_cost, product_photo, product_variant, product, category, manufacturer_line, manufacturer, sync_run, external_sale, number_counter, rate_counter RESTART IDENTITY CASCADE`;
}

export async function seedVariant(
  opts: { price?: string; stock?: number; status?: "DRAFT" | "PUBLISHED"; taxRate?: string } = {},
) {
  const id = randomUUID().slice(0, 8);
  const product = await db.product.create({
    data: { slug: `p-${id}`, name: `Boja ${id}`, status: opts.status ?? "PUBLISHED" },
  });
  return db.productVariant.create({
    data: {
      productId: product.id,
      sku: `S-${id}`,
      size: "120 ml",
      price: opts.price ?? "10.00",
      taxRate: opts.taxRate ?? "0",
      stockQty: opts.stock ?? 5,
      cost: { create: { purchaseKm: "4.55", margin: "2.50" } },
    },
  });
}

export const seedDelivery = (price = "8.00", freeFrom?: string) =>
  db.deliveryRate.create({ data: { name: "Brza pošta", price, freeFrom } });

export const orderInput = (
  variantId: number,
  deliveryRateId: number,
  qty: number,
  expectedTotal: string,
) => ({
  checkoutKey: randomUUID(),
  customerName: "Test Kupac",
  email: "kupac@example.com",
  phone: "+38761000000",
  address: "Ulica 1",
  city: "Sarajevo",
  postalCode: "71000",
  paymentMethod: "CASH_ON_DELIVERY" as const,
  deliveryRateId,
  expectedTotal,
  lines: [{ variantId, qty }],
});
