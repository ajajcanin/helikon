import { beforeEach, describe, expect, it } from "vitest";
import {
  listFeaturedRows,
  saveFeatured,
  searchFeaturedCandidates,
  topProducts,
} from "@/features/content/featured";
import { changeOrderStatus } from "@/features/orders/change-status";
import { placeOrder } from "@/features/orders/place-order";
import { db } from "@/server/db";
import { listFeaturedProducts } from "@/server/public/catalog";
import { orderInput, resetDb, seedDelivery, seedVariant } from "./helpers";

const actor = { id: null, name: "Klijent" };

beforeEach(async () => {
  await resetDb();
  await db.setting.deleteMany();
});

describe("featured list", () => {
  it("keeps the chosen order, removes repeats, and refuses too many or unknown items", async () => {
    const a = await seedVariant();
    const b = await seedVariant();
    await saveFeatured([b.productId, a.productId, b.productId], actor);
    expect((await listFeaturedRows()).map((r) => r.id)).toEqual([b.productId, a.productId]);
    await expect(saveFeatured([999999], actor)).rejects.toThrow(/ne postoji/);
    await expect(saveFeatured([1, 2, 3, 4, 5, 6, 7, 8, 9], actor)).rejects.toThrow(/Najviše 8/);
  });

  it("the shop leaves out hidden and sold-out items, and staff see why", async () => {
    const ok = await seedVariant({ stock: 3 });
    const draft = await seedVariant({ status: "DRAFT" });
    const empty = await seedVariant({ stock: 0 });
    const ids = [draft.productId, ok.productId, empty.productId];
    await saveFeatured(ids, actor);
    expect((await listFeaturedProducts(ids)).map((p) => p.id)).toEqual([ok.productId]);
    expect((await listFeaturedRows()).map((r) => r.hiddenBecause)).toEqual(["draft", null, "stock"]);
  });

  it("search finds published products by name and šifra, without purchase data", async () => {
    const a = await seedVariant();
    await seedVariant({ status: "DRAFT" });
    const product = await db.product.findUniqueOrThrow({ where: { id: a.productId } });
    expect((await searchFeaturedCandidates(a.sku)).map((r) => r.id)).toEqual([a.productId]);
    expect((await searchFeaturedCandidates(product.name)).map((r) => r.id)).toEqual([a.productId]);
    expect(await searchFeaturedCandidates("x")).toEqual([]);
    expect(JSON.stringify(await searchFeaturedCandidates(a.sku))).not.toMatch(/purchase|margin|4\.55/i);
  });
});

describe("top products", () => {
  it("ranks by units sold and by profit, which can differ", async () => {
    const d = await seedDelivery("0.00");
    // Many cheap units against few with a high margin. seedVariant costs 4.55 per unit.
    const many = await seedVariant({ price: "5.00", stock: 50 });
    const few = await seedVariant({ price: "100.00", stock: 50 });
    await placeOrder(orderInput(many.id, d.id, 10, "50.00"));
    await placeOrder(orderInput(few.id, d.id, 2, "200.00"));
    expect((await topProducts("sold", 8)).map((r) => r.id)).toEqual([many.productId, few.productId]);
    expect((await topProducts("profit", 8)).map((r) => r.id)).toEqual([few.productId, many.productId]);
    expect(await topProducts("sold", 1)).toHaveLength(1);
  });

  it("ignores cancelled orders, and products that can't be shown", async () => {
    const d = await seedDelivery("0.00");
    const cancelled = await seedVariant({ price: "10.00", stock: 5 });
    const soldOut = await seedVariant({ price: "10.00", stock: 1 });
    const hidden = await seedVariant({ price: "10.00", stock: 5 });
    const o = await placeOrder(orderInput(cancelled.id, d.id, 2, "20.00"));
    await changeOrderStatus(o.id, "CANCELLED", actor);
    await placeOrder(orderInput(soldOut.id, d.id, 1, "10.00"));
    await placeOrder(orderInput(hidden.id, d.id, 1, "10.00"));
    await db.product.update({ where: { id: hidden.productId }, data: { status: "DRAFT" } });
    expect(await topProducts("sold", 8)).toEqual([]);
  });

  it("counts store sales too, and leaves items with no known purchase price out of profit", async () => {
    const v = await seedVariant({ price: "10.00" });
    const noCost = await seedVariant({ price: "10.00" });
    await db.variantCost.delete({ where: { variantId: noCost.id } });
    await db.externalSale.createMany({
      data: [
        { system: "pantheon", externalId: "1", soldAt: new Date(), sku: v.sku, qty: 3, revenue: "30.00" },
        {
          system: "pantheon",
          externalId: "2",
          soldAt: new Date(),
          sku: noCost.sku,
          qty: 9,
          revenue: "90.00",
        },
      ],
    });
    expect((await topProducts("sold", 8)).map((r) => r.id)).toEqual([noCost.productId, v.productId]);
    expect((await topProducts("profit", 8)).map((r) => r.id)).toEqual([v.productId]);
  });
});
