import { beforeEach, describe, expect, it } from "vitest";
import { GET as searchRoute } from "@/app/api/search/route";
import { readCart } from "@/features/orders/checkout-actions";
import { db } from "@/server/db";
import {
  countPublishedProducts,
  familiesIn,
  listLineColours,
  listPublishedProducts,
  searchSuggestions,
} from "@/server/public/catalog";
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

  it("suggests only published products, with the full count and no purchase data", async () => {
    const { dear } = await seed();
    await db.product.update({ where: { id: dear.productId }, data: { name: "Plavi lak" } });
    for (let i = 0; i < 3; i++) {
      const extra = await seedVariant({ price: "1.00", stock: 1 });
      await db.product.update({ where: { id: extra.productId }, data: { name: `Plavi ${i}` } });
    }
    const found = await searchSuggestions("plav", 2);
    expect(found.total).toBe(5);
    expect(found.rows.length).toBe(2);
    const sale = (await searchSuggestions("plavi lak")).rows[0];
    expect(sale).toMatchObject({ name: "Plavi lak", price: 50, severalPrices: false, inStock: false });
    expect(JSON.stringify(sale)).not.toMatch(/purchase|margin|cost|reviewNote|confirmedBy/i);
  });

  it("finds names with or without č, ć, ž, š, đ, and treats search characters as text", async () => {
    const yellow = await seedVariant();
    const flower = await seedVariant();
    await db.product.update({
      where: { id: yellow.productId },
      data: { name: "Boja", colourName: "Žuta šećer" },
    });
    await db.product.update({ where: { id: flower.productId }, data: { name: "Đurđevak" } });
    const ids = async (q: string) => (await listPublishedProducts({ q })).map((p) => p.id);
    for (const q of ["zuta", "Žuta", "ŽUTA", "secer", "šećer"])
      expect(await ids(q)).toEqual([yellow.productId]);
    for (const q of ["durdevak", "djurdjevak", "Đurđevak"]) expect(await ids(q)).toEqual([flower.productId]);
    expect(await countPublishedProducts({ q: "zuta" })).toBe(1);
    expect(await ids("%")).toEqual([]);
    expect(await ids("z_ta")).toEqual([]);
    expect(await ids(yellow.sku)).toEqual([yellow.productId]);
  });

  it("lists a line's published colours and leaves out items without a colour", async () => {
    const maker = await db.manufacturer.create({ data: { slug: "m", name: "M" } });
    const line = await db.manufacturerLine.create({ data: { manufacturerId: maker.id, name: "L" } });
    const place = async (id: number, colourName: string | null) =>
      db.product.update({ where: { id }, data: { lineId: line.id, colourName } });
    const red = await seedVariant({ stock: 0 });
    const blue = await seedVariant();
    const draft = await seedVariant({ status: "DRAFT" });
    const tool = await seedVariant();
    await place(red.productId, "Crvena");
    await place(blue.productId, "Plava");
    await place(draft.productId, "Skica");
    await place(tool.productId, null);
    const colours = await listLineColours(line.id);
    expect(colours.map((c) => c.colourName)).toEqual(["Crvena", "Plava"]);
    expect(colours[0]?.variants).toEqual([{ stockQty: 0 }]);
    expect(JSON.stringify(colours)).not.toMatch(/purchase|margin|reviewNote|confirmedBy/i);
  });

  it("answers the search box, ignoring anything too short to search", async () => {
    await seed();
    const ask = (q: string) => searchRoute(new Request(`http://shop/api/search?q=${q}`));
    expect(await (await ask("p")).json()).toEqual({ total: 0, rows: [] });
    expect((await (await ask("plav")).json()).total).toBe(1);
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
