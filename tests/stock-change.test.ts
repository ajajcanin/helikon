import { beforeEach, describe, expect, it } from "vitest";
import { applyStockChange } from "@/features/catalog/products";
import { db } from "@/server/db";
import { resetDb, seedVariant } from "./helpers";

const actor = { id: null, name: "Klijent" };
const stockOf = async (id: number) => (await db.productVariant.findUniqueOrThrow({ where: { id } })).stockQty;

describe("changing stock by reason", () => {
  beforeEach(resetDb);

  it("adds received goods, takes off damaged ones and sets a count", async () => {
    const v = await seedVariant({ stock: 5 });
    await applyStockChange(v.id, { mode: "add", qty: 12 }, "Prijem robe", actor);
    expect(await stockOf(v.id)).toBe(17);
    await applyStockChange(v.id, { mode: "remove", qty: 2 }, "Oštećeno", actor);
    expect(await stockOf(v.id)).toBe(15);
    await applyStockChange(v.id, { mode: "set", qty: 9 }, "Popis", actor);
    expect(await stockOf(v.id)).toBe(9);

    const notes = await db.stockMovement.findMany({
      where: { variantId: v.id, reason: "ADJUSTMENT" },
      orderBy: { id: "asc" },
    });
    expect(notes.map((m) => [m.delta, m.note])).toEqual([
      [12, "Prijem robe"],
      [-2, "Oštećeno"],
      [-6, "Popis"],
    ]);
  });

  it("won't take off more than there is", async () => {
    const v = await seedVariant({ stock: 3 });
    await expect(applyStockChange(v.id, { mode: "remove", qty: 4 }, "Oštećeno", actor)).rejects.toThrow(
      "Na stanju je samo 3.",
    );
    expect(await stockOf(v.id)).toBe(3);
  });
});
