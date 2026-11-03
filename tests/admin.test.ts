import { beforeEach, describe, expect, it } from "vitest";
import { getAnalytics } from "@/features/analytics/analytics";
import {
  createCategory,
  deleteCategory,
  listCategoryTree,
  moveCategory,
  renameCategory,
  shiftCategory,
} from "@/features/catalog/categories";
import {
  createLine,
  createManufacturer,
  deleteLine,
  deleteManufacturer,
  listManufacturers,
  renameManufacturer,
} from "@/features/catalog/manufacturers";
import { adjustStock, listProducts, setProductStatus } from "@/features/catalog/products";
import { reviewOptions, updateReviewField } from "@/features/catalog/review";
import {
  applyPrices,
  applyStockLevels,
  markOrderExported,
  ordersToExport,
  recordExternalSales,
  runSync,
} from "@/features/integrations/sync";
import {
  createDeliveryRate,
  deleteDeliveryRate,
  listOrders,
  setPaymentStatus,
} from "@/features/orders/admin";
import { changeOrderStatus } from "@/features/orders/change-status";
import { orderRefreshTags, placeOrder } from "@/features/orders/place-order";
import { saveCompanySettings } from "@/features/settings/settings";
import { createUser, setUserActive, setUserPassword, setUserRole } from "@/features/users/users";
import { getCompanySettings } from "@/server/company";
import { db } from "@/server/db";
import { orderInput, resetDb, seedDelivery, seedVariant } from "./helpers";

const actor = { id: null, name: "Admin" };

describe("categories", () => {
  beforeEach(resetDb);

  it("adds, renames, moves and reorders, keeping two levels", async () => {
    const a = await createCategory({ name: "Boje", parentId: null }, actor);
    const b = await createCategory({ name: "Alati", parentId: null }, actor);
    const sub = await createCategory({ name: "Akrilne", parentId: a.id }, actor);
    const second = await createCategory({ name: "Uljane", parentId: a.id }, actor);

    await expect(createCategory({ name: "Dublje", parentId: sub.id }, actor)).rejects.toThrow(
      /potkategorije/,
    );
    await expect(moveCategory(a.id, b.id, actor)).rejects.toThrow(/potkategorije/);

    await renameCategory(sub.id, "Akril", actor);
    expect((await db.category.findUniqueOrThrow({ where: { id: sub.id } })).slug).toBe("akrilne");

    await shiftCategory(second.id, "up", actor);
    expect((await listCategoryTree())[0]!.children.map((c) => c.name)).toEqual(["Uljane", "Akril"]);

    await moveCategory(sub.id, b.id, actor);
    const tree = await listCategoryTree();
    expect(tree.find((t) => t.id === b.id)!.children.map((c) => c.name)).toEqual(["Akril"]);
  });

  it("gives a duplicate name its own address", async () => {
    const a = await createCategory({ name: "Boje", parentId: null }, actor);
    const b = await createCategory({ name: "Boje", parentId: a.id }, actor);
    expect(b.slug).toBe("boje-2");
  });

  it("won't delete a category that is in use", async () => {
    const top = await createCategory({ name: "Boje", parentId: null }, actor);
    const sub = await createCategory({ name: "Akrilne", parentId: top.id }, actor);
    const v = await seedVariant();
    await db.product.update({ where: { id: v.productId }, data: { categoryId: sub.id } });
    await expect(deleteCategory(top.id, actor)).rejects.toThrow(/potkategorije/);
    await expect(deleteCategory(sub.id, actor)).rejects.toThrow(/artikala/);
    await db.product.update({ where: { id: v.productId }, data: { categoryId: null } });
    await deleteCategory(sub.id, actor);
    await deleteCategory(top.id, actor);
    expect(await listCategoryTree()).toEqual([]);
  });
});

describe("manufacturers and lines", () => {
  beforeEach(resetDb);

  async function rich() {
    await createManufacturer("Rich", actor);
    const maker = await db.manufacturer.findFirstOrThrow({ where: { name: "Rich" } });
    await createLine(maker.id, "Master Acrylic", actor);
    const line = await db.manufacturerLine.findFirstOrThrow();
    return { maker, line };
  }

  it("refuses duplicates and deleting what is in use", async () => {
    const { maker, line } = await rich();
    await expect(createManufacturer("rich", actor)).rejects.toThrow(/postoji/);
    await expect(createLine(maker.id, "master acrylic", actor)).rejects.toThrow(/postoji/);
    await renameManufacturer(maker.id, "Rich Hobby", actor);
    const v = await seedVariant();
    await db.product.update({
      where: { id: v.productId },
      data: { manufacturerId: maker.id, lineId: line.id },
    });
    await expect(deleteLine(line.id, actor)).rejects.toThrow(/artikala/);
    await expect(deleteManufacturer(maker.id, actor)).rejects.toThrow(/artikala/);
    await db.product.update({ where: { id: v.productId }, data: { manufacturerId: null, lineId: null } });
    await expect(deleteManufacturer(maker.id, actor)).rejects.toThrow(/linije/);
    await deleteLine(line.id, actor);
    await deleteManufacturer(maker.id, actor);
    expect(await listManufacturers()).toEqual([]);
  });

  it("a product's line must belong to its manufacturer, and changing manufacturer clears the line", async () => {
    const { maker, line } = await rich();
    await createManufacturer("Drugi", actor);
    const other = await db.manufacturer.findFirstOrThrow({ where: { name: "Drugi" } });
    const v = await seedVariant();
    await expect(updateReviewField(v.productId, "lineId", String(line.id), actor)).rejects.toThrow(
      /ne pripada/,
    );
    await updateReviewField(v.productId, "manufacturerId", String(maker.id), actor);
    await updateReviewField(v.productId, "lineId", String(line.id), actor);
    expect(await updateReviewField(v.productId, "manufacturerId", String(maker.id), actor)).toMatchObject({
      changed: false,
    });
    expect((await db.product.findUniqueOrThrow({ where: { id: v.productId } })).lineId).toBe(line.id);
    await updateReviewField(v.productId, "manufacturerId", String(other.id), actor);
    expect(await db.product.findUniqueOrThrow({ where: { id: v.productId } })).toMatchObject({
      manufacturerId: other.id,
      lineId: null,
    });
    const options = await reviewOptions();
    expect(options.manufacturers.find((m) => m.name === "Rich")!.lines[0]!.name).toBe("Master Acrylic");
  });
});

describe("products list", () => {
  beforeEach(resetDb);

  it("filters by stock and status and never shows purchase data", async () => {
    await seedVariant({ stock: 0 });
    await seedVariant({ stock: 2, status: "DRAFT" });
    await seedVariant({ stock: 50 });
    expect((await listProducts({})).total).toBe(3);
    expect((await listProducts({ stock: "out" })).total).toBe(1);
    expect((await listProducts({ stock: "low" })).total).toBe(2);
    expect((await listProducts({ status: "DRAFT" })).total).toBe(1);
    expect(JSON.stringify((await listProducts({})).rows)).not.toMatch(/purchase|margin|4\.55/i);
  });

  it("publishing needs an active priced variant", async () => {
    const v = await seedVariant({ status: "DRAFT", price: "0" });
    await expect(setProductStatus(v.productId, "PUBLISHED", actor)).rejects.toThrow(/cijenom/);
    await db.productVariant.update({ where: { id: v.id }, data: { price: "5" } });
    await setProductStatus(v.productId, "PUBLISHED", actor);
    expect((await db.product.findUniqueOrThrow({ where: { id: v.productId } })).status).toBe("PUBLISHED");
  });

  it("a stock count records the difference and refuses nonsense", async () => {
    const v = await seedVariant({ stock: 5 });
    await adjustStock(v.id, 8, "popis", actor);
    expect(await db.stockMovement.findFirstOrThrow({ where: { variantId: v.id } })).toMatchObject({
      delta: 3,
      reason: "ADJUSTMENT",
      note: "popis",
    });
    await adjustStock(v.id, 8, "", actor);
    expect(await db.stockMovement.count({ where: { variantId: v.id } })).toBe(1);
    await expect(adjustStock(v.id, -1, "", actor)).rejects.toThrow();
    await expect(adjustStock(v.id, 1.5, "", actor)).rejects.toThrow();
  });
});

describe("orders admin and delivery", () => {
  beforeEach(resetDb);

  it("refreshes a product's page after an order, and lists only when it sells out", async () => {
    const d = await seedDelivery("0.00");
    const plenty = await seedVariant({ price: "10.00", stock: 5 });
    const last = await seedVariant({ price: "10.00", stock: 1 });
    const slugOf = async (id: number) =>
      (await db.product.findUniqueOrThrow({ where: { id }, select: { slug: true } })).slug;
    const first = await placeOrder(orderInput(plenty.id, d.id, 1, "10.00"));
    expect(await orderRefreshTags(first.id)).toEqual([`product:${await slugOf(plenty.productId)}`]);
    const second = await placeOrder(orderInput(last.id, d.id, 1, "10.00"));
    expect(await orderRefreshTags(second.id)).toEqual([`product:${await slugOf(last.productId)}`, "catalog"]);
  });

  it("payment moves one way only", async () => {
    const v = await seedVariant({ price: "10.00" });
    const d = await seedDelivery("0.00");
    const o = await placeOrder(orderInput(v.id, d.id, 1, "10.00"));
    await expect(setPaymentStatus(o.id, "REFUNDED", actor)).rejects.toThrow();
    await setPaymentStatus(o.id, "PAID", actor);
    await setPaymentStatus(o.id, "REFUNDED", actor);
    expect((await listOrders({})).rows[0]!.paymentStatus).toBe("REFUNDED");
  });

  it("a used delivery can't be deleted, and amounts must be numbers", async () => {
    await expect(
      createDeliveryRate({ name: "Pošta", price: "abc", freeFrom: "", active: true }, actor),
    ).rejects.toThrow();
    await createDeliveryRate({ name: "Pošta", price: "8,50", freeFrom: "100", active: true }, actor);
    const rate = await db.deliveryRate.findFirstOrThrow();
    expect(rate.price.toString()).toBe("8.5");
    const v = await seedVariant({ price: "10.00" });
    await placeOrder(orderInput(v.id, rate.id, 1, "18.50"));
    await expect(deleteDeliveryRate(rate.id, actor)).rejects.toThrow(/koriste/);
  });
});

describe("users", () => {
  beforeEach(async () => {
    await db.user.deleteMany();
  });

  it("creates a user who can be managed, always keeping an administrator", async () => {
    await createUser(
      { name: "Ana", email: "ANA@example.com", password: "dugacka-lozinka", role: "ADMINISTRATOR" },
      actor,
    );
    const ana = await db.user.findUniqueOrThrow({ where: { email: "ana@example.com" } });
    await expect(
      createUser(
        { name: "Ana", email: "ana@example.com", password: "dugacka-lozinka", role: "UREDNIK" },
        actor,
      ),
    ).rejects.toThrow(/postoji/);
    await expect(
      createUser({ name: "Kratka", email: "k@example.com", password: "kratka", role: "UREDNIK" }, actor),
    ).rejects.toThrow(/10/);
    await expect(setUserRole(ana.id, "UREDNIK", actor)).rejects.toThrow(/administrator/);
    await expect(setUserActive(ana.id, false, actor)).rejects.toThrow(/administrator/);
    await expect(setUserActive(ana.id, false, { id: ana.id, name: "Ana" })).rejects.toThrow(/sami sebe/);
    await createUser(
      { name: "Ben", email: "ben@example.com", password: "dugacka-lozinka", role: "ADMINISTRATOR" },
      actor,
    );
    await db.session.create({
      data: { id: "s", token: "t", userId: ana.id, expiresAt: new Date(Date.now() + 1000) },
    });
    await setUserActive(ana.id, false, actor);
    expect(await db.session.count({ where: { userId: ana.id } })).toBe(0);
    const before = (await db.account.findFirstOrThrow({ where: { userId: ana.id } })).password;
    await setUserPassword(ana.id, "nova-dugacka-lozinka", actor);
    expect((await db.account.findFirstOrThrow({ where: { userId: ana.id } })).password).not.toBe(before);
  });
});

describe("settings", () => {
  beforeEach(async () => {
    await db.setting.deleteMany();
  });

  it("starts from the company's data and saves changes", async () => {
    const start = await getCompanySettings();
    expect(start).toMatchObject({ legalName: "HELIKON d.o.o. Sarajevo", jib: "", inPdv: false });
    await expect(saveCompanySettings({ ...start, inPdv: true }, actor)).rejects.toThrow(/PDV broj/);
    await saveCompanySettings({ ...start, phone: "+387 33 000 000" }, actor);
    expect((await getCompanySettings()).phone).toBe("+387 33 000 000");
  });
});

describe("Pantheon preparation", () => {
  beforeEach(resetDb);

  it("stock and prices apply by šifra, and an unknown šifra doesn't stop the rest", async () => {
    const v = await seedVariant({ stock: 5, price: "10.00" });
    const run = await runSync("pantheon", "stock", () =>
      applyStockLevels([
        { sku: v.sku, qty: 9 },
        { sku: "nema", qty: 1 },
      ]),
    );
    expect(run).toMatchObject({ status: "SUCCESS", processed: 1, failed: 1 });
    expect(await db.stockMovement.findFirstOrThrow({ where: { variantId: v.id } })).toMatchObject({
      delta: 4,
      reason: "SYNC",
    });
    expect(
      await applyPrices([
        { sku: v.sku, price: "12.50" },
        { sku: v.sku, price: "0" },
      ]),
    ).toEqual({ processed: 1, failed: 1 });
  });

  it("records a failed exchange instead of crashing", async () => {
    const run = await runSync("pantheon", "stock", async () => {
      throw new Error("Veza nije uspjela");
    });
    expect(run).toMatchObject({ status: "FAILED", error: "Veza nije uspjela" });
    expect(run.finishedAt).toBeInstanceOf(Date);
  });

  it("the same sale sent twice counts once, and only confirmed orders go out, once", async () => {
    const sale = { externalId: "R-1", soldAt: new Date(), sku: "S", name: "Boja", qty: 2, revenue: "20.00" };
    await runSync("pantheon", "sales", (id) => recordExternalSales("pantheon", id, [sale]));
    await runSync("pantheon", "sales", (id) => recordExternalSales("pantheon", id, [sale]));
    expect(await db.externalSale.count()).toBe(1);

    const v = await seedVariant({ price: "10.00" });
    const d = await seedDelivery("0.00");
    const o = await placeOrder(orderInput(v.id, d.id, 1, "10.00"));
    expect(await ordersToExport()).toHaveLength(0);
    await changeOrderStatus(o.id, "CONFIRMED", { id: null, name: "A" });
    expect((await ordersToExport()).map((x) => x.id)).toEqual([o.id]);
    await markOrderExported(o.id, "P-77");
    expect(await ordersToExport()).toHaveLength(0);
  });
});

describe("analytics", () => {
  beforeEach(resetDb);

  it("counts real sales from both channels and leaves out cancelled orders", async () => {
    const v = await seedVariant({ price: "10.00", stock: 10 });
    const d = await seedDelivery("5.00");
    await placeOrder(orderInput(v.id, d.id, 2, "25.00"));
    const cancelled = await placeOrder(orderInput(v.id, d.id, 1, "15.00"));
    await changeOrderStatus(cancelled.id, "CANCELLED", { id: null, name: "A" });
    await recordExternalSales(
      "pantheon",
      (await db.syncRun.create({ data: { system: "pantheon", kind: "sales" } })).id,
      [{ externalId: "R-1", soldAt: new Date(), sku: v.sku, name: "Boja", qty: 3, revenue: "30.00" }],
    );

    const data = await getAnalytics(30);
    expect(data).toMatchObject({ revenue: 55, web: 25, external: 30, orders: 1, average: 25, items: 2 });
    expect(data.series).toHaveLength(30);
    expect(data.series.reduce((sum, day) => sum + day.revenue, 0)).toBe(55);
    expect(data.top[0]).toMatchObject({ sku: v.sku, qty: 5, revenue: 50 });
    expect(data.stock).toMatchObject({ units: 8, retail: 80, cost: 36.4, out: 0 });
  });

  it("leaves out sales older than the period", async () => {
    const run = await db.syncRun.create({ data: { system: "pantheon", kind: "sales" } });
    await recordExternalSales("pantheon", run.id, [
      {
        externalId: "old",
        soldAt: new Date(Date.now() - 40 * 86_400_000),
        sku: "S",
        qty: 1,
        revenue: "99.00",
      },
    ]);
    expect((await getAnalytics(30)).revenue).toBe(0);
    expect((await getAnalytics(90)).revenue).toBe(99);
  });
});
