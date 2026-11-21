import { Decimal } from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductStatus } from "@/generated/prisma/enums";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { db } from "@/server/db";

const PAGE_SIZE = 50;
const LOW_STOCK = 3;

export type ProductFilters = {
  q?: string;
  categoryId?: number;
  status?: ProductStatus;
  stock?: "out" | "low";
  page?: number;
};

/** The item list. No purchase data: staff open a product to edit it. */
export async function listProducts({ q, categoryId, status, stock, page = 1 }: ProductFilters) {
  const search = q?.trim();
  const and: Prisma.ProductWhereInput[] = [];
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { colourName: { contains: search, mode: "insensitive" } },
        { variants: { some: { sku: { contains: search } } } },
      ],
    });
  }
  if (categoryId) and.push({ OR: [{ categoryId }, { category: { parentId: categoryId } }] });
  if (status) and.push({ status });
  if (stock === "out") and.push({ variants: { some: { stockQty: 0 } } });
  if (stock === "low") and.push({ variants: { some: { stockQty: { lte: LOW_STOCK } } } });
  const where: Prisma.ProductWhereInput = and.length ? { AND: and } : {};

  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        status: true,
        confirmed: true,
        category: { select: { name: true } },
        variants: {
          orderBy: { sort: "asc" },
          select: { sku: true, size: true, price: true, stockQty: true },
        },
      },
    }),
    db.product.count({ where }),
  ]);
  return {
    total,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    rows: rows.map((r) => {
      const prices = r.variants.map((v) => new Decimal(v.price.toString()));
      return {
        id: r.id,
        name: r.name,
        status: r.status,
        confirmed: r.confirmed,
        category: r.category?.name ?? null,
        skus: r.variants.map((v) => v.sku).join(", "),
        sizes: r.variants
          .map((v) => v.size)
          .filter(Boolean)
          .join(" / "),
        priceFrom: prices.length ? Decimal.min(...prices).toNumber() : null,
        priceTo: prices.length ? Decimal.max(...prices).toNumber() : null,
        stock: r.variants.reduce((sum, v) => sum + v.stockQty, 0),
      };
    }),
  };
}

/** Publishing needs something to sell: an active variant with a price. */
export async function setProductStatus(id: number, status: ProductStatus, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id }, include: { variants: true } });
    if (!product) throw new UserError("Artikal ne postoji.");
    if (product.status === status) return;
    if (
      status === "PUBLISHED" &&
      !product.variants.some((v) => v.active && new Decimal(v.price.toString()).greaterThan(0))
    ) {
      throw new UserError("Artikal nema aktivnu šifru s cijenom.");
    }
    await tx.product.update({ where: { id }, data: { status } });
    await audit(tx, actor, {
      action: "status",
      table: "product",
      recordId: id,
      summary: `Artikal ${product.name}: ${product.status} → ${status}`,
      changes: { status: [product.status, status] },
    });
  });
}

/** Sets stock after a count. The row is locked, so a sale at the same moment isn't lost, and the movement explains it. */
export const adjustStock = (variantId: number, newQty: number, note: string, actor: AuditActor) =>
  applyStockChange(variantId, { mode: "set", qty: newQty }, note, actor);

/** Goods received or returned add, written-off goods subtract, a count sets the stock outright. */
export type StockChange = { mode: "add" | "remove" | "set"; qty: number };

/**
 * Changes one šifra's stock. The new amount is worked out under the row's lock, so a sale at the same moment
 * isn't lost when goods are added.
 */
export async function applyStockChange(
  variantId: number,
  change: StockChange,
  note: string,
  actor: AuditActor,
) {
  if (!Number.isInteger(change.qty) || change.qty < 0)
    throw new UserError("Količina mora biti cijeli broj, 0 ili više.");
  await db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ stock_qty: number; sku: string }[]>`
      SELECT stock_qty, sku FROM product_variant WHERE id = ${variantId} FOR UPDATE`;
    const current = locked[0];
    if (!current) throw new UserError("Šifra ne postoji.");
    const newQty =
      change.mode === "set"
        ? change.qty
        : change.mode === "add"
          ? current.stock_qty + change.qty
          : current.stock_qty - change.qty;
    if (newQty < 0) throw new UserError(`Na stanju je samo ${current.stock_qty}.`);
    const delta = newQty - current.stock_qty;
    if (delta === 0) return;
    await tx.productVariant.update({ where: { id: variantId }, data: { stockQty: newQty } });
    await tx.stockMovement.create({
      data: { variantId, delta, reason: "ADJUSTMENT", note: note.trim() || null },
    });
    await audit(tx, actor, {
      action: "update",
      table: "product_variant",
      recordId: current.sku,
      summary: `Zaliha šifre ${current.sku}: ${current.stock_qty} → ${newQty}`,
      changes: { stockQty: [current.stock_qty, newQty] },
    });
  });
}

/**
 * One motif sold in the store. The till only knows the series' šifra, so staff record which motif went, and its
 * stock on the web follows.
 */
export async function recordStoreSale(variantId: number, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ stock_qty: number; sku: string }[]>`
      SELECT stock_qty, sku FROM product_variant WHERE id = ${variantId} FOR UPDATE`;
    const current = locked[0];
    if (!current) throw new UserError("Šifra ne postoji.");
    if (current.stock_qty < 1) throw new UserError("Zaliha je već 0.");
    await tx.productVariant.update({ where: { id: variantId }, data: { stockQty: current.stock_qty - 1 } });
    await tx.stockMovement.create({ data: { variantId, delta: -1, reason: "STORE_SALE" } });
    await audit(tx, actor, {
      action: "update",
      table: "product_variant",
      recordId: current.sku,
      summary: `Prodano u radnji, šifra ${current.sku}`,
      changes: { stockQty: [current.stock_qty, current.stock_qty - 1] },
    });
  });
}

/** How many of each of a product's šifre went: on the web (less cancelled orders) and in the store. */
export async function soldCounts(productId: number) {
  const rows = await db.stockMovement.groupBy({
    by: ["variantId", "reason"],
    where: { variant: { productId }, reason: { in: ["ORDER", "ORDER_CANCELLED", "STORE_SALE"] } },
    _sum: { delta: true },
  });
  const counts = new Map<number, { web: number; store: number }>();
  for (const r of rows) {
    const count = counts.get(r.variantId) ?? { web: 0, store: 0 };
    if (r.reason === "STORE_SALE") count.store -= r._sum.delta ?? 0;
    else count.web -= r._sum.delta ?? 0;
    counts.set(r.variantId, count);
  }
  return Object.fromEntries(counts);
}

/**
 * Shows or hides one šifra in the shop, such as one size that won't be stocked while the others stay.
 * A product's last šifra in the shop can't be hidden: archive the product instead.
 */
export async function setVariantActive(variantId: number, active: boolean, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { sku: true, active: true, productId: true, externalId: true },
    });
    if (!variant) throw new UserError("Šifra ne postoji.");
    if (variant.active === active) return;
    if (!active) {
      const others = await tx.productVariant.count({
        where: { productId: variant.productId, active: true, id: { not: variantId } },
      });
      if (others === 0) throw new UserError("Ovo je jedina šifra u prodavnici. Arhivirajte artikal.");
    }
    await tx.productVariant.update({ where: { id: variantId }, data: { active } });
    await audit(tx, actor, {
      action: "update",
      table: "product_variant",
      recordId: variant.sku,
      summary: active
        ? `Šifra ${variant.sku} vraćena u prodavnicu`
        : `Šifra ${variant.sku} sakrivena u prodavnici`,
      changes: { active: [variant.active, active] },
    });
  });
}
