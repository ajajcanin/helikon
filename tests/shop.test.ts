import { beforeEach, describe, expect, it } from "vitest";
import { readCart } from "@/features/orders/checkout-actions";
import { db } from "@/server/db";
import { countPublishedProducts, familiesIn, listPublishedProducts } from "@/server/public/catalog";
import { resetDb, seedDelivery, seedVariant } from "./helpers";

describe("shop catalogue", () => {
  beforeEach(resetDb);

  async function seed() {
    const cheap = await seedVariant({ price: "5.00", stock: 3 });
    const dear = await seedVariant({ price: "50.00", stock: 0 });
    await db.product.update({
      where: { id: cheap.productId },
      data: { colourFamily: "plave", colourName: "Plava" },
    });
    await db.product.update({ where: { id: dear.productId }, data: { colourFamily: "zlatne" } });
    await seedVariant({ status: "DRAFT" });
    return { cheap, dear };
  }

  it("filters by colour family and stock, and searches colour name and šifra", async () => {
    const { cheap, dear } = await seed();
    expect((await listPublishedProducts({})).length).toBe(2);
    expect((await listPublishedProducts({ family: "plave" })).map((p) => p.id)).toEqual([cheap.productId]);
    expect((await listPublishedProducts({ inStock: true })).map((p) => p.id)).toEqual([cheap.productId]);
    expect(await countPublishedProducts({ inStock: true })).toBe(1);
    expect((await listPublishedProducts({ q: "plav" })).map((p) => p.id)).toEqual([cheap.productId]);
    expect((await listPublishedProducts({ q: dear.sku })).map((p) => p.id)).toEqual([dear.productId]);
    expect((await familiesIn()).sort()).toEqual(["plave", "zlatne"]);
  });

  it("sorts by lowest price both ways, with paging", async () => {
    const { cheap, dear } = await seed();
    expect((await listPublishedProducts({ sort: "priceAsc" })).map((p) => p.id)).toEqual([
      cheap.productId,
      dear.productId,
    ]);
    expect((await listPublishedProducts({ sort: "priceDesc" })).map((p) => p.id)).toEqual([
      dear.productId,
      cheap.productId,
    ]);
    expect((await listPublishedProducts({ sort: "priceDesc", take: 1, skip: 1 })).map((p) => p.id)).toEqual([
      cheap.productId,
    ]);
  });
});

describe("cart", () => {
  beforeEach(resetDb);

  it("takes prices from the database, and adds delivery only when it applies", async () => {
    const v = await seedVariant({ price: "60.00", stock: 5 });
    const d = await seedDelivery("8.00", "100.00");
    const one = await readCart([{ variantId: v.id, qty: 1, unitPrice: "0.01" }], d.id);
    expect(one).toMatchObject({ subtotal: "60.00", deliveryPrice: "8.00", total: "68.00" });
    const two = await readCart([{ variantId: v.id, qty: 2 }], d.id);
    expect(two).toMatchObject({ subtotal: "120.00", deliveryPrice: "0.00", total: "120.00" });
  });

  it("flags what can't be bought and leaves it out of the total, and never returns purchase data", async () => {
    const v = await seedVariant({ price: "10.00", stock: 5 });
    const draft = await seedVariant({ price: "99.00", status: "DRAFT" });
    const cart = await readCart([
      { variantId: v.id, qty: 1 },
      { variantId: draft.id, qty: 1 },
      { variantId: 999999, qty: 1 },
    ]);
    expect(cart.lines.map((l) => l.available)).toEqual([true, false]);
    expect(cart.total).toBe("10.00");
    expect(JSON.stringify(cart)).not.toMatch(/purchase|margin|4\.55/i);
    expect((await readCart("not a cart")).lines).toEqual([]);
  });
});
