import { beforeEach, describe, expect, it } from "vitest";
import { changeOrderStatus } from "@/features/orders/change-status";
import { OrderError, placeOrder } from "@/features/orders/place-order";
import { canTransition } from "@/features/orders/status";
import { SYSTEM_ACTOR } from "@/server/audit";
import { db } from "@/server/db";
import { orderInput, resetDb, seedDelivery, seedVariant } from "./helpers";

const stockOf = async (id: number) => (await db.productVariant.findUniqueOrThrow({ where: { id } })).stockQty;

describe("placeOrder", () => {
  beforeEach(resetDb);

  it("takes stock, freezes the line and numbers the order", async () => {
    const v = await seedVariant({ price: "10.00", stock: 5 });
    const d = await seedDelivery("8.00");
    const order = await placeOrder(orderInput(v.id, d.id, 2, "28.00"));

    expect(order.number).toMatch(/^\d{4}-000001$/);
    expect(order.total.toString()).toBe("28");
    expect(await stockOf(v.id)).toBe(3);
    expect(await db.stockMovement.count({ where: { orderId: order.id, delta: -2 } })).toBe(1);

    await db.productVariant.update({ where: { id: v.id }, data: { price: "99.00" } });
    const line = await db.orderLine.findFirstOrThrow({ where: { orderId: order.id } });
    expect(line.unitPrice.toString()).toBe("10");
  });

  it("sells the last unit to exactly one of two simultaneous buyers", async () => {
    const v = await seedVariant({ price: "10.00", stock: 1 });
    const d = await seedDelivery("0.00");
    const results = await Promise.allSettled([
      placeOrder(orderInput(v.id, d.id, 1, "10.00")),
      placeOrder(orderInput(v.id, d.id, 1, "10.00")),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await stockOf(v.id)).toBe(0);
    expect(await db.order.count()).toBe(1);
  });

  it("changes nothing when one line of the order is short", async () => {
    const a = await seedVariant({ price: "10.00", stock: 5 });
    const b = await seedVariant({ price: "10.00", stock: 1 });
    const d = await seedDelivery("0.00");
    const input = orderInput(a.id, d.id, 2, "50.00");
    input.lines = [
      { variantId: a.id, qty: 2 },
      { variantId: b.id, qty: 3 },
    ];
    await expect(placeOrder(input)).rejects.toMatchObject({ code: "out_of_stock", variantIds: [b.id] });
    expect(await stockOf(a.id)).toBe(5);
    expect(await db.order.count()).toBe(0);
    expect(await db.numberCounter.count()).toBe(0);
  });

  it("returns the same order for a repeated submit, also at the same moment", async () => {
    const v = await seedVariant({ price: "10.00", stock: 5 });
    const d = await seedDelivery("0.00");
    const input = orderInput(v.id, d.id, 1, "10.00");
    const [one, two] = await Promise.all([placeOrder(input), placeOrder(input)]);
    const three = await placeOrder(input);
    expect(new Set([one.id, two.id, three.id]).size).toBe(1);
    expect(await stockOf(v.id)).toBe(4);
  });

  it("stops when the total differs from what the customer saw", async () => {
    const v = await seedVariant({ price: "12.00", stock: 5 });
    const d = await seedDelivery("0.00");
    await expect(placeOrder(orderInput(v.id, d.id, 1, "10.00"))).rejects.toMatchObject({
      code: "price_changed",
    });
    expect(await stockOf(v.id)).toBe(5);
  });

  it("refuses unpublished products and inactive delivery", async () => {
    const draft = await seedVariant({ status: "DRAFT" });
    const d = await seedDelivery("0.00");
    await expect(placeOrder(orderInput(draft.id, d.id, 1, "10.00"))).rejects.toBeInstanceOf(OrderError);
    const v = await seedVariant();
    await db.deliveryRate.update({ where: { id: d.id }, data: { active: false } });
    await expect(placeOrder(orderInput(v.id, d.id, 1, "10.00"))).rejects.toMatchObject({
      code: "delivery_unavailable",
    });
  });

  it("rejects bad input before touching the database", async () => {
    const input = { ...orderInput(1, 1, 1, "10.00"), checkoutKey: "short" };
    await expect(placeOrder(input)).rejects.toThrow();
    await expect(
      placeOrder({ ...orderInput(1, 1, 1, "10.00"), lines: [{ variantId: 1, qty: 0 }] }),
    ).rejects.toThrow();
  });
});

describe("changeOrderStatus", () => {
  beforeEach(resetDb);

  async function order() {
    const v = await seedVariant({ price: "10.00", stock: 5 });
    const d = await seedDelivery("0.00");
    return { v, order: await placeOrder(orderInput(v.id, d.id, 2, "20.00")) };
  }

  it("returns stock once when cancelled, even if two staff click together", async () => {
    const { v, order: o } = await order();
    const results = await Promise.allSettled([
      changeOrderStatus(o.id, "CANCELLED", SYSTEM_ACTOR),
      changeOrderStatus(o.id, "CANCELLED", SYSTEM_ACTOR),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await stockOf(v.id)).toBe(5);
  });

  it("follows the flow, records it, and refuses to skip steps", async () => {
    const { v, order: o } = await order();
    // The audit log can't be emptied between tests, so count what this test adds.
    const auditWhere = { tableName: "order", recordId: String(o.id) };
    const auditBefore = await db.auditLog.count({ where: auditWhere });
    await expect(changeOrderStatus(o.id, "DELIVERED", SYSTEM_ACTOR)).rejects.toThrow();
    for (const s of ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const)
      await changeOrderStatus(o.id, s, SYSTEM_ACTOR);
    expect(await stockOf(v.id)).toBe(3);
    expect(await db.orderEvent.count({ where: { orderId: o.id } })).toBe(5);
    expect(await db.auditLog.count({ where: auditWhere })).toBe(auditBefore + 4);
    await changeOrderStatus(o.id, "RETURNED", SYSTEM_ACTOR);
    expect(await stockOf(v.id)).toBe(5);
    expect(canTransition("RETURNED", "NEW")).toBe(false);
  });
});
