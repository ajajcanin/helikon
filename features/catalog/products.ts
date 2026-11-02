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
export async function adjustStock(variantId: number, newQty: number, note: string, actor: AuditActor) {
  if (!Number.isInteger(newQty) || newQty < 0)
    throw new UserError("Zaliha mora biti cijeli broj, 0 ili više.");
  await db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ stock_qty: number; sku: string }[]>`
      SELECT stock_qty, sku FROM product_variant WHERE id = ${variantId} FOR UPDATE`;
    const current = locked[0];
    if (!current) throw new UserError("Šifra ne postoji.");
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
