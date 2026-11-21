import { beforeEach, describe, expect, it } from "vitest";
import { listHistory } from "@/features/admin/history";
import { setVariantActive } from "@/features/catalog/products";
import { db } from "@/server/db";
import { getPublishedProduct } from "@/server/public/catalog";
import { resetDb, seedVariant } from "./helpers";

const actor = { id: null, name: "Klijent" };

describe("hiding one šifra", () => {
  beforeEach(resetDb);

  it("takes that size out of the shop and keeps the others", async () => {
    const small = await seedVariant();
    const product = await db.product.findUniqueOrThrow({ where: { id: small.productId } });
    const large = await db.productVariant.create({
      data: {
        productId: small.productId,
        sku: `${small.sku}-L`,
        size: "240 ml",
        price: "20.00",
        stockQty: 3,
      },
    });

    await setVariantActive(small.id, false, actor);

    const shown = await getPublishedProduct(product.slug);
    expect(shown?.variants.map((v) => v.id)).toEqual([large.id]);
    const [row] = (await listHistory({ table: "product_variant" })).rows;
    expect(row!.changes).toContainEqual({ field: "active", from: "prikazana", to: "sakrivena" });

    await setVariantActive(small.id, true, actor);
    expect((await getPublishedProduct(product.slug))?.variants).toHaveLength(2);
  });

  it("won't hide a product's last šifra in the shop", async () => {
    const only = await seedVariant();
    await expect(setVariantActive(only.id, false, actor)).rejects.toThrow("Arhivirajte artikal");
  });
});
