import { beforeEach, describe, expect, it } from "vitest";
import { recordStoreSale, soldCounts } from "@/features/catalog/products";
import { topProducts } from "@/features/content/featured";
import { db } from "@/server/db";
import { resetDb, seedVariant } from "./helpers";

const actor = { id: null, name: "Klijent" };

/** A series sold under one šifra in the financial system, split into two motifs here. */
async function seedSeries() {
  const series = await seedVariant({ price: "4.00", stock: 0 });
  await db.product.update({ where: { id: series.productId }, data: { variantKind: "MOTIF" } });
  await db.productVariant.update({ where: { id: series.id }, data: { active: false } });
  const motif = (sku: string) =>
    db.productVariant.create({
      data: { productId: series.productId, sku, externalId: "2800", size: sku, price: "4.00", stockQty: 5 },
    });
  return { productId: series.productId, first: await motif("2801"), second: await motif("2802") };
}

describe("motifs of a series", () => {
  beforeEach(resetDb);

  it("lets the motifs share the series' šifra", async () => {
    const { first, second } = await seedSeries();
    expect(first.externalId).toBe(second.externalId);
  });

  it("records a store sale on one motif and counts it", async () => {
    const { productId, first } = await seedSeries();
    await recordStoreSale(first.id, actor);
    await recordStoreSale(first.id, actor);

    expect((await db.productVariant.findUniqueOrThrow({ where: { id: first.id } })).stockQty).toBe(3);
    expect((await soldCounts(productId))[first.id]).toEqual({ web: 0, store: 2 });
  });

  it("refuses a store sale when the motif has none left", async () => {
    const { first } = await seedSeries();
    await db.productVariant.update({ where: { id: first.id }, data: { stockQty: 0 } });
    await expect(recordStoreSale(first.id, actor)).rejects.toThrow("Zaliha je već 0.");
  });

  it("counts the till's sales under the series' šifra for the series, once", async () => {
    const { productId } = await seedSeries();
    await db.externalSale.create({
      data: {
        system: "pantheon",
        externalId: "1",
        soldAt: new Date(),
        sku: "2800",
        qty: 3,
        revenue: "12.00",
      },
    });
    expect((await topProducts("sold", 8)).map((r) => r.id)).toEqual([productId]);
  });
});
