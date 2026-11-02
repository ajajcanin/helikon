import { Decimal } from "decimal.js";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit, diff } from "@/server/audit";
import { db } from "@/server/db";
import { COLOUR_FAMILIES } from "./classify";
import type { Spec } from "./product-details";

const PAGE_SIZE = 50;
const FAMILY_IDS = COLOUR_FAMILIES.map(([id]) => id) as string[];

/** "Baza: Voda" per line, the way staff edit it. */
export function specsToText(specs: unknown): string {
  if (!Array.isArray(specs)) return "";
  return (specs as Spec[]).map((s) => `${s.label}: ${s.value}`).join("\n");
}

function textToSpecs(text: string): Spec[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const at = line.indexOf(":");
      if (at < 1 || !line.slice(at + 1).trim())
        throw new UserError(`Red "${line}" treba biti u obliku Naziv: vrijednost.`);
      return { label: line.slice(0, at).trim(), value: line.slice(at + 1).trim() };
    });
}

const optionalText = (value: string) => value.trim() || null;

export const REVIEW_FIELDS = [
  "name",
  "categoryId",
  "manufacturerId",
  "lineId",
  "colourName",
  "colourNameMaker",
  "colourCode",
  "colourFamily",
  "medium",
  "finish",
  "description",
  "specs",
] as const;
export type ReviewField = (typeof REVIEW_FIELDS)[number];

/** Turns the submitted text into the value stored for that field, or refuses it. */
async function parseField(field: ReviewField, value: string): Promise<Prisma.ProductUncheckedUpdateInput> {
  switch (field) {
    case "name": {
      const name = value.trim();
      if (name.length < 2) throw new UserError("Naziv je prekratak.");
      return { name };
    }
    case "categoryId": {
      const category = await db.category.findUnique({ where: { id: Number(value) }, select: { id: true } });
      if (!category) throw new UserError("Odaberite kategoriju.");
      return { categoryId: category.id };
    }
    case "manufacturerId": {
      // The line belongs to the old manufacturer, so it goes too.
      if (!value) return { manufacturerId: null, lineId: null };
      const manufacturer = await db.manufacturer.findUnique({
        where: { id: Number(value) },
        select: { id: true },
      });
      if (!manufacturer) throw new UserError("Odaberite proizvođača.");
      return { manufacturerId: manufacturer.id, lineId: null };
    }
    case "lineId": {
      if (!value) return { lineId: null };
      const line = await db.manufacturerLine.findUnique({
        where: { id: Number(value) },
        select: { id: true },
      });
      if (!line) throw new UserError("Odaberite liniju.");
      return { lineId: line.id };
    }
    case "colourFamily":
      if (value && !FAMILY_IDS.includes(value)) throw new UserError("Odaberite porodicu boje.");
      return { colourFamily: value || null };
    case "medium":
      if (value && value !== "akril" && value !== "ulje") throw new UserError("Odaberite medij.");
      return { medium: value || null };
    case "specs": {
      const specs = textToSpecs(value);
      return { specs: specs.length ? specs : [] };
    }
    default:
      return { [field]: optionalText(value) };
  }
}

/**
 * Saves one field. A real change also confirms the product, because the person looked at it and corrected it.
 * Saving the same value changes nothing, so clicking through a field doesn't confirm by accident.
 */
export async function updateReviewField(id: number, field: ReviewField, value: string, actor: AuditActor) {
  const data = await parseField(field, value);
  return db.$transaction(async (tx) => {
    const before = await tx.product.findUnique({ where: { id } });
    if (!before) throw new UserError("Artikal ne postoji.");
    if (field === "manufacturerId" && before.manufacturerId === data.manufacturerId) {
      return { changed: false, confirmed: before.confirmed };
    }
    if (field === "lineId" && data.lineId) {
      const line = await tx.manufacturerLine.findUnique({ where: { id: data.lineId as number } });
      if (line?.manufacturerId !== before.manufacturerId)
        throw new UserError("Ta linija ne pripada ovom proizvođaču.");
    }
    const changes = diff(before as unknown as Record<string, unknown>, data as Record<string, unknown>);
    if (Object.keys(changes).length === 0) return { changed: false, confirmed: before.confirmed };
    await tx.product.update({
      where: { id },
      data: { ...data, confirmed: true, confirmedAt: new Date(), confirmedBy: actor.name },
    });
    await audit(tx, actor, {
      action: "update",
      table: "product",
      recordId: id,
      summary: `Potvrda: izmijenjeno polje ${field} na artiklu ${before.name}`,
      changes: changes as Prisma.InputJsonValue,
    });
    return { changed: true, confirmed: true };
  });
}

const variantFields = z.discriminatedUnion("field", [
  z.object({ field: z.literal("size"), value: z.string() }),
  z.object({ field: z.literal("price"), value: z.string() }),
]);

/** The same rule for a variant's size and price: a real change confirms its product. */
export async function updateVariantField(
  id: number,
  input: z.infer<typeof variantFields>,
  actor: AuditActor,
) {
  const { field, value } = variantFields.parse(input);
  let data: Prisma.ProductVariantUpdateInput;
  if (field === "size") {
    data = { size: optionalText(value) };
  } else {
    const text = value.trim().replace(",", ".");
    if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new UserError("Cijena mora biti broj, npr. 13,30.");
    data = { price: text };
  }
  return db.$transaction(async (tx) => {
    const before = await tx.productVariant.findUnique({ where: { id }, include: { product: true } });
    if (!before) throw new UserError("Artikal ne postoji.");
    const same = field === "price" ? before.price.equals(data.price as string) : before.size === data.size;
    if (same) return { changed: false, confirmed: before.product.confirmed };
    await tx.productVariant.update({ where: { id }, data });
    await tx.product.update({
      where: { id: before.productId },
      data: { confirmed: true, confirmedAt: new Date(), confirmedBy: actor.name },
    });
    await audit(tx, actor, {
      action: "update",
      table: "product_variant",
      recordId: before.sku,
      summary: `Potvrda: ${field === "price" ? "cijena" : "veličina"} šifre ${before.sku}`,
      changes: {
        [field]: [
          field === "price" ? new Decimal(before.price.toString()).toFixed(2) : before.size,
          field === "price" ? new Decimal(data.price as string).toFixed(2) : (data.size as string | null),
        ],
      },
    });
    return { changed: true, confirmed: true };
  });
}

/** Confirms products as they are, one or a whole page. */
export async function confirmProducts(ids: number[], actor: AuditActor) {
  return db.$transaction(async (tx) => {
    const { count } = await tx.product.updateMany({
      where: { id: { in: ids }, confirmed: false },
      data: { confirmed: true, confirmedAt: new Date(), confirmedBy: actor.name },
    });
    if (count > 0) {
      await audit(tx, actor, {
        action: count > 1 ? "bulk" : "update",
        table: "product",
        recordId: ids.length === 1 ? ids[0] : null,
        summary: `Potvrda: potvrđeno artikala: ${count}`,
        changes: { ids },
      });
    }
    return count;
  });
}

export type ReviewFilters = {
  q?: string;
  status?: "open" | "done" | "all";
  categoryId?: number;
  page?: number;
};

const reviewInclude = {
  variants: {
    orderBy: { sort: "asc" },
    select: { id: true, sku: true, size: true, price: true, stockQty: true },
  },
} satisfies Prisma.ProductInclude;

function toReviewRow(r: Prisma.ProductGetPayload<{ include: typeof reviewInclude }>) {
  return {
    id: r.id,
    name: r.name,
    categoryId: r.categoryId,
    manufacturerId: r.manufacturerId,
    lineId: r.lineId,
    colourName: r.colourName,
    colourNameMaker: r.colourNameMaker,
    colourCode: r.colourCode,
    colourFamily: r.colourFamily,
    medium: r.medium,
    finish: r.finish,
    description: r.description,
    specs: specsToText(r.specs),
    reviewNote: r.reviewNote,
    confirmed: r.confirmed,
    confirmedBy: r.confirmedBy,
    variants: r.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      price: v.price.toFixed(2),
      stockQty: v.stockQty,
    })),
  };
}

/** One product with everything staff edit. */
export async function getReviewRow(id: number) {
  const row = await db.product.findUnique({ where: { id }, include: reviewInclude });
  return row ? toReviewRow(row) : null;
}

/** One page of products with everything staff check, including purchase-free variant data. */
export async function listForReview({ q, status = "open", categoryId, page = 1 }: ReviewFilters) {
  const search = q?.trim();
  const where: Prisma.ProductWhereInput = {
    ...(status === "all" ? {} : { confirmed: status === "done" }),
    ...(categoryId ? { OR: [{ categoryId }, { category: { parentId: categoryId } }] } : {}),
    ...(search
      ? {
          AND: [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { colourName: { contains: search, mode: "insensitive" } },
                { variants: { some: { sku: { contains: search } } } },
              ],
            },
          ],
        }
      : {}),
  };
  const [rows, filtered, total, done] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ category: { sort: "asc" } }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: reviewInclude,
    }),
    db.product.count({ where }),
    db.product.count(),
    db.product.count({ where: { confirmed: true } }),
  ]);
  return {
    rows: rows.map(toReviewRow),
    filtered,
    total,
    done,
    pages: Math.max(1, Math.ceil(filtered / PAGE_SIZE)),
  };
}

export type ReviewRow = ReturnType<typeof toReviewRow>;

/** Options for the selects: subcategories under their parent's name. */
export async function reviewOptions() {
  const [categories, manufacturers] = await Promise.all([
    db.category.findMany({
      orderBy: { sort: "asc" },
      select: {
        id: true,
        name: true,
        parentId: true,
        parent: { select: { name: true } },
        _count: { select: { children: true } },
      },
    }),
    db.manufacturer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, lines: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
    }),
  ]);
  const tops = categories.filter((c) => !c.parentId);
  const childrenOf = (id: number) => categories.filter((c) => c.parentId === id);
  return {
    // Each subcategory straight after its parent, whatever their sort numbers.
    categories: tops
      .flatMap((top) => [top, ...childrenOf(top.id)])
      .map((c) => ({
        id: c.id,
        label: c.parent ? `${c.parent.name} > ${c.name}` : c.name,
        // A top category with subcategories only groups them: products go in a subcategory.
        isTop: !c.parent,
        selectable: c._count.children === 0,
      })),
    categoryTree: tops.map((top) => ({
      id: top.id,
      name: top.name,
      children: childrenOf(top.id).map((c) => ({ id: c.id, name: c.name })),
    })),
    manufacturers,
  };
}
