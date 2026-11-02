import { beforeEach, describe, expect, it } from "vitest";
import { audit, diff, SYSTEM_ACTOR } from "@/server/audit";
import { db } from "@/server/db";
import { getPublishedProduct, listCategoryTree, listPublishedProducts } from "@/server/public/catalog";
import { rateLimit } from "@/server/rate-limit";
import { resetDb, seedVariant } from "./helpers";

describe("audit log", () => {
  it("can't be changed or deleted", async () => {
    await db.$transaction((tx) =>
      audit(tx, SYSTEM_ACTOR, { action: "test", table: "t", summary: "original" }),
    );
    const row = await db.auditLog.findFirstOrThrow({ where: { action: "test" }, orderBy: { id: "desc" } });
    await expect(db.auditLog.update({ where: { id: row.id }, data: { summary: "changed" } })).rejects.toThrow(
      /append-only/,
    );
    await expect(db.auditLog.delete({ where: { id: row.id } })).rejects.toThrow(/append-only/);
  });

  it("disappears with the change when the change fails", async () => {
    const summary = `rollback-${Date.now()}`;
    await expect(
      db.$transaction(async (tx) => {
        await audit(tx, SYSTEM_ACTOR, { action: "test", table: "t", summary });
        throw new Error("change failed");
      }),
    ).rejects.toThrow();
    expect(await db.auditLog.count({ where: { summary } })).toBe(0);
  });

  it("diff keeps only changed fields", () => {
    expect(diff({ a: 1, b: "x" }, { a: 2, b: "x" })).toEqual({ a: [1, 2] });
  });
});

describe("stock", () => {
  beforeEach(resetDb);
  it("can't go below zero in the database", async () => {
    const v = await seedVariant({ stock: 1 });
    await expect(db.productVariant.update({ where: { id: v.id }, data: { stockQty: -1 } })).rejects.toThrow();
  });
});

describe("rate limit", () => {
  beforeEach(resetDb);
  it("is shared through the database and resets after the window", async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => rateLimit("k", 3, 60_000)));
    expect(results.filter(Boolean)).toHaveLength(3);
    await db.rateCounter.updateMany({ data: { windowStart: new Date(Date.now() - 120_000) } });
    expect(await rateLimit("k", 3, 60_000)).toBe(true);
  });
  it("stores no readable key", async () => {
    await rateLimit("subscribe:1.2.3.4", 3, 60_000);
    const rows = await db.rateCounter.findMany();
    expect(rows[0]!.key).not.toContain("1.2.3.4");
  });
});

describe("public catalogue", () => {
  beforeEach(resetDb);
  it("a top category lists its subcategories' products, and empty ones stay hidden", async () => {
    const top = await db.category.create({ data: { slug: "boje", name: "Boje" } });
    const sub = await db.category.create({ data: { slug: "akrilne", name: "Akrilne", parentId: top.id } });
    const empty = await db.category.create({ data: { slug: "ulje", name: "Ulje", parentId: top.id } });
    const v = await seedVariant();
    await db.product.update({ where: { id: v.productId }, data: { categoryId: sub.id } });
    await db.product.create({ data: { slug: "draft", name: "Skica", categoryId: empty.id } });

    expect(await listPublishedProducts({ categorySlug: "boje" })).toHaveLength(1);
    expect(await listPublishedProducts({ categorySlug: "akrilne" })).toHaveLength(1);
    expect(await listPublishedProducts({ categorySlug: "ulje" })).toHaveLength(0);
    const tree = await listCategoryTree();
    expect(tree.map((c) => c.slug)).toEqual(["boje"]);
    expect(tree[0]!.children.map((c) => c.slug)).toEqual(["akrilne"]);
  });

  it("shows only published items and never purchase data", async () => {
    const pub = await seedVariant({ status: "PUBLISHED" });
    await seedVariant({ status: "DRAFT" });
    const list = await listPublishedProducts();
    expect(list).toHaveLength(1);
    const product = await db.product.findUniqueOrThrow({ where: { id: pub.productId } });
    const detail = await getPublishedProduct(product.slug);
    const json = JSON.stringify([list, detail]);
    expect(json).not.toMatch(/cost|purchase|margin|4\.55/i);
  });
});
