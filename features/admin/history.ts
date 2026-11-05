import { COLOUR_FAMILIES } from "@/lib/colour-families";
import { mergeEdits } from "@/lib/history-merge";
import { specsToText } from "@/lib/specs";
import { db } from "@/server/db";

const PAGE_SIZE = 50;

export const HISTORY_TABLES = [
  "product",
  "product_variant",
  "category",
  "manufacturer",
  "article",
  "order",
  "delivery_rate",
  "user",
  "setting",
] as const;

/** The product fields whose old and new values are shown. Anything else, such as purchase data, stays out. */
export const HISTORY_FIELDS = [
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
  "size",
  "price",
  "stockQty",
  "status",
] as const;
export type HistoryField = (typeof HISTORY_FIELDS)[number];

const STATUS: Record<string, string> = { DRAFT: "Skica", PUBLISHED: "Objavljeno", ARCHIVED: "Arhivirano" };

const isShown = (field: string): field is HistoryField =>
  (HISTORY_FIELDS as readonly string[]).includes(field);

const productChanges = (table: string, changes: unknown) =>
  (table === "product" || table === "product_variant") && changes && typeof changes === "object"
    ? Object.entries(changes as Record<string, unknown>).flatMap(([field, value]) =>
        isShown(field) && Array.isArray(value) && value.length === 2
          ? [{ field, from: value[0] as unknown, to: value[1] as unknown }]
          : [],
      )
    : [];

/** Older entries say "Potvrda" and name fields as the code does, so they read properly here without being changed. */
export function historyTitle(summary: string | null, action: string) {
  if (!summary) return action;
  if (summary.startsWith("Potvrda: izmijenjeno polje")) return "Izmijenjen artikal";
  return summary
    .replace(/^Potvrda: cijena šifre (.+)$/, "Izmijenjena cijena")
    .replace(/^Potvrda: veličina šifre (.+)$/, "Izmijenjena veličina")
    .replace(/^Zaliha šifre (\S+):.*$/, "Izmijenjena zaliha")
    .replace(/^Artikal .*: \w+ → \w+$/, "Promijenjena objava artikla")
    .replace(/^Potvrda: /, "");
}

const asIds = (values: unknown[]) => values.filter((v): v is number => typeof v === "number");

export async function listHistory({
  table,
  page = 1,
  take = PAGE_SIZE,
}: {
  table?: string;
  page?: number;
  take?: number;
}) {
  const where = table ? { tableName: table } : {};
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * take,
      take,
      select: {
        id: true,
        at: true,
        userName: true,
        summary: true,
        action: true,
        tableName: true,
        recordId: true,
        changes: true,
      },
    }),
    db.auditLog.count({ where }),
  ]);

  const recordIds = (tableName: string) =>
    rows.flatMap((r) => (r.tableName === tableName && r.recordId ? [r.recordId] : []));
  const parsed = mergeEdits(
    rows.map((r) => ({
      ...r,
      title: historyTitle(r.summary, r.action),
      shown: productChanges(r.tableName, r.changes),
    })),
  );
  const valuesOf = (field: HistoryField) =>
    asIds(parsed.flatMap((r) => r.shown.filter((c) => c.field === field).flatMap((c) => [c.from, c.to])));

  const [products, variants, categories, manufacturers, lines] = await Promise.all([
    db.product.findMany({
      where: {
        id: {
          in: recordIds("product")
            .filter((id) => /^\d+$/.test(id))
            .map(Number),
        },
      },
      select: {
        id: true,
        name: true,
        variants: { orderBy: { sort: "asc" }, select: { sku: true } },
      },
    }),
    db.productVariant.findMany({
      where: { sku: { in: recordIds("product_variant") } },
      select: { sku: true, product: { select: { id: true, name: true } } },
    }),
    db.category.findMany({ where: { id: { in: valuesOf("categoryId") } }, select: { id: true, name: true } }),
    db.manufacturer.findMany({
      where: { id: { in: valuesOf("manufacturerId") } },
      select: { id: true, name: true },
    }),
    db.manufacturerLine.findMany({
      where: { id: { in: valuesOf("lineId") } },
      select: { id: true, name: true },
    }),
  ]);

  const named = (list: { id: number; name: string }[], value: unknown) =>
    list.find((item) => item.id === value)?.name ?? value;
  const readable = (field: HistoryField, value: unknown) => {
    const shown =
      field === "categoryId"
        ? named(categories, value)
        : field === "manufacturerId"
          ? named(manufacturers, value)
          : field === "lineId"
            ? named(lines, value)
            : field === "colourFamily"
              ? (COLOUR_FAMILIES.find(([id]) => id === value)?.[1] ?? value)
              : field === "status"
                ? (STATUS[String(value)] ?? value)
                : field === "specs"
                  ? specsToText(value)
                  : value;
    return shown === null || shown === undefined || shown === "" ? null : String(shown);
  };

  // A change to one šifra names that šifra; a change to the product names all of its šifre.
  const productOf = (tableName: string, recordId: string | null) => {
    if (tableName === "product") {
      const product = products.find((p) => String(p.id) === recordId);
      return product
        ? { id: product.id, name: product.name, skus: product.variants.map((v) => v.sku) }
        : null;
    }
    const variant = tableName === "product_variant" ? variants.find((v) => v.sku === recordId) : undefined;
    return variant ? { id: variant.product.id, name: variant.product.name, skus: [variant.sku] } : null;
  };

  return {
    rows: parsed.map((r) => ({
      id: r.id,
      at: r.at,
      userName: r.userName,
      title: r.title,
      product: productOf(r.tableName, r.recordId),
      changes: r.shown.map((c) => ({
        field: c.field as HistoryField,
        from: readable(c.field, c.from),
        to: readable(c.field, c.to),
      })),
    })),
    pages: Math.max(1, Math.ceil(total / take)),
  };
}

export type HistoryRow = Awaited<ReturnType<typeof listHistory>>["rows"][number];
