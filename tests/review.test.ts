import { beforeEach, describe, expect, it } from "vitest";
import {
  confirmProducts,
  listForReview,
  unconfirmProduct,
  updateReviewField,
  updateVariantField,
} from "@/features/catalog/review";
import { db } from "@/server/db";
import { resetDb, seedVariant } from "./helpers";

const actor = { id: null, name: "Klijent" };
const product = (id: number) => db.product.findUniqueOrThrow({ where: { id } });

describe("confirmation page", () => {
  beforeEach(resetDb);

  it("a real change saves without confirming the product, with who and what recorded", async () => {
    const v = await seedVariant();
    const auditBefore = await db.auditLog.count({
      where: { tableName: "product", recordId: String(v.productId) },
    });
    const res = await updateReviewField(v.productId, "colourName", "Okeansko plava", actor);
    expect(res).toEqual({ changed: true });
    const p = await product(v.productId);
    expect(p).toMatchObject({ colourName: "Okeansko plava", confirmed: false, confirmedBy: null });
    expect(p.confirmedAt).toBeNull();
    expect(await db.auditLog.count({ where: { tableName: "product", recordId: String(v.productId) } })).toBe(
      auditBefore + 1,
    );
  });

  it("saving the same value changes nothing", async () => {
    const v = await seedVariant();
    await db.product.update({ where: { id: v.productId }, data: { colourName: "Plava" } });
    expect(await updateReviewField(v.productId, "colourName", "Plava", actor)).toEqual({ changed: false });
    expect(await updateReviewField(v.productId, "description", "  ", actor)).toEqual({ changed: false });
  });

  it("refuses invalid values and leaves the product unconfirmed", async () => {
    const v = await seedVariant();
    await expect(updateReviewField(v.productId, "colourFamily", "duga", actor)).rejects.toThrow();
    await expect(updateReviewField(v.productId, "medium", "voda", actor)).rejects.toThrow();
    await expect(updateReviewField(v.productId, "name", " ", actor)).rejects.toThrow();
    await expect(updateReviewField(v.productId, "specs", "bez dvotacke", actor)).rejects.toThrow();
    await expect(updateVariantField(v.id, { field: "price", value: "abc" }, actor)).rejects.toThrow();
    expect((await product(v.productId)).confirmed).toBe(false);
  });

  it("reads specs as Name: value lines", async () => {
    const v = await seedVariant();
    await updateReviewField(v.productId, "specs", "Baza: Voda\n\nVrhovi: 1 mm: 6 mm", actor);
    expect((await product(v.productId)).specs).toEqual([
      { label: "Baza", value: "Voda" },
      { label: "Vrhovi", value: "1 mm: 6 mm" },
    ]);
    const [row] = (await listForReview({ status: "all" })).rows;
    expect(row!.specs).toBe("Baza: Voda\nVrhovi: 1 mm: 6 mm");
  });

  it("changing a variant's price saves it without confirming its product", async () => {
    const v = await seedVariant({ price: "240.00" });
    expect(await updateVariantField(v.id, { field: "price", value: "240,00" }, actor)).toMatchObject({
      changed: false,
    });
    expect(await updateVariantField(v.id, { field: "price", value: "40,00" }, actor)).toMatchObject({
      changed: true,
    });
    const after = await db.productVariant.findUniqueOrThrow({
      where: { id: v.id },
      include: { product: true },
    });
    expect(after.price.toString()).toBe("40");
    expect(after.product.confirmed).toBe(false);
  });

  it("confirms by button and can be put back on the list", async () => {
    const v = await seedVariant();
    expect(await confirmProducts([v.productId], actor)).toBe(1);
    expect(await product(v.productId)).toMatchObject({ confirmed: true, confirmedBy: "Klijent" });
    expect(await unconfirmProduct(v.productId, actor)).toBe(1);
    expect(await unconfirmProduct(v.productId, actor)).toBe(0);
    const p = await product(v.productId);
    expect(p).toMatchObject({ confirmed: false, confirmedBy: null });
    expect(p.confirmedAt).toBeNull();
  });

  it("confirms one or many, and filters by status, search and category", async () => {
    const a = await seedVariant();
    const b = await seedVariant();
    const top = await db.category.create({ data: { slug: "top", name: "Top" } });
    const sub = await db.category.create({ data: { slug: "sub", name: "Sub", parentId: top.id } });
    await db.product.update({ where: { id: b.productId }, data: { categoryId: sub.id } });

    expect((await listForReview({})).filtered).toBe(2);
    expect((await listForReview({ q: a.sku })).rows.map((r) => r.id)).toEqual([a.productId]);
    expect((await listForReview({ categoryId: top.id })).rows.map((r) => r.id)).toEqual([b.productId]);

    expect(await confirmProducts([a.productId, b.productId], actor)).toBe(2);
    expect(await confirmProducts([a.productId], actor)).toBe(0);
    const data = await listForReview({});
    expect(data).toMatchObject({ filtered: 0, total: 2, done: 2 });
    expect((await listForReview({ status: "done" })).filtered).toBe(2);
  });

  it("never exposes purchase data", async () => {
    await seedVariant();
    expect(JSON.stringify((await listForReview({})).rows)).not.toMatch(/purchase|margin|4\.55/i);
  });
});
