import { Decimal } from "decimal.js";
import { UserError } from "@/server/admin/action";
import type { AuditActor } from "@/server/audit";
import { FEATURED_KEY, FEATURED_MAX, getFeaturedIds } from "@/server/content";
import { db } from "@/server/db";
import { setSetting } from "@/server/settings";
import { publicUrl } from "@/server/storage";

const rowSelect = {
  id: true,
  name: true,
  status: true,
  colourName: true,
  colourNameMaker: true,
  colourFamily: true,
  category: { select: { name: true } },
  variants: {
    where: { active: true },
    orderBy: { sort: "asc" },
    select: { sku: true, price: true, stockQty: true },
  },
  photos: { orderBy: { sort: "asc" }, take: 1, select: { storageKey: true, alt: true } },
} as const;

type Row = Awaited<ReturnType<typeof loadRows>>[number];

function loadRows(where: { id: { in: number[] } } | object, take?: number) {
  return db.product.findMany({ where, select: rowSelect, orderBy: { name: "asc" }, take });
}

function toRow(p: Row) {
  const prices = p.variants.map((v) => new Decimal(v.price.toString()));
  const stock = p.variants.reduce((sum, v) => sum + v.stockQty, 0);
  const photo = p.photos[0];
  return {
    id: p.id,
    name: p.colourName ?? p.colourNameMaker ?? p.name,
    fullName: p.name,
    category: p.category?.name ?? null,
    colourFamily: p.colourFamily,
    skus: p.variants.map((v) => v.sku).join(", "),
    priceFrom: prices.length ? Decimal.min(...prices).toFixed(2) : null,
    stock,
    imageUrl: photo && process.env.NEXT_PUBLIC_MEDIA_URL ? publicUrl(`${photo.storageKey}/320.webp`) : null,
    /** What keeps it off the homepage, if anything */
    hiddenBecause: p.status !== "PUBLISHED" ? ("draft" as const) : stock === 0 ? ("stock" as const) : null,
  };
}

export type FeaturedRow = ReturnType<typeof toRow>;

async function rowsInOrder(ids: number[]) {
  const rows = await loadRows({ id: { in: ids } });
  return ids.flatMap((id) => {
    const row = rows.find((r) => r.id === id);
    return row ? [toRow(row)] : [];
  });
}

export async function listFeaturedRows() {
  return rowsInOrder(await getFeaturedIds());
}

/** Products to add: published ones, found by name, colour or šifra. */
export async function searchFeaturedCandidates(rawQuery: string) {
  const q = rawQuery.trim().slice(0, 100);
  if (q.length < 2) return [];
  const rows = await loadRows(
    {
      status: "PUBLISHED",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { colourName: { contains: q, mode: "insensitive" } },
        { colourNameMaker: { contains: q, mode: "insensitive" } },
        { variants: { some: { sku: { contains: q } } } },
      ],
    },
    12,
  );
  return rows.map(toRow);
}

export async function saveFeatured(rawIds: number[], actor: AuditActor) {
  const ids = [...new Set(rawIds)];
  if (ids.length > FEATURED_MAX) throw new UserError(`Najviše ${FEATURED_MAX} artikala.`);
  const found = await db.product.count({ where: { id: { in: ids } } });
  if (found !== ids.length) throw new UserError("Neki artikal više ne postoji.");
  await setSetting(FEATURED_KEY, { ids }, actor);
  return rowsInOrder(ids);
}

/**
 * The best products by all sales so far: webshop orders plus store sales from the financial system. Only products that
 * can be shown right now count. Profit is income minus quantity at the current purchase price, and sales of items with
 * no known purchase price are left out of it. Cancelled and returned orders don't count.
 */
export async function topProducts(by: "sold" | "profit", take: number) {
  const rows = await db.$queryRaw<{ product_id: number }[]>`
    WITH sales AS (
      SELECT l.variant_id, l.qty, l.line_total AS revenue
        FROM order_line l JOIN "order" o ON o.id = l.order_id
       WHERE o.status NOT IN ('CANCELLED', 'RETURNED')
      UNION ALL
      SELECT v.id, e.qty, e.revenue
        FROM external_sale e JOIN product_variant v ON v.sku = e.sku
    )
    SELECT v.product_id,
           sum(s.qty) AS sold,
           sum(s.revenue - s.qty * c.purchase_km) AS profit
      FROM sales s
      JOIN product_variant v ON v.id = s.variant_id
      JOIN product p ON p.id = v.product_id
      LEFT JOIN variant_cost c ON c.variant_id = v.id
     WHERE p.status = 'PUBLISHED'
       AND EXISTS (SELECT 1 FROM product_variant a WHERE a.product_id = p.id AND a.active AND a.stock_qty > 0)
     GROUP BY v.product_id
    HAVING ${by} = 'sold' OR sum(s.revenue - s.qty * c.purchase_km) IS NOT NULL
     ORDER BY CASE WHEN ${by} = 'sold' THEN sum(s.qty)::numeric ELSE sum(s.revenue - s.qty * c.purchase_km) END DESC,
              v.product_id
     LIMIT ${take}`;
  return rowsInOrder(rows.map((r) => r.product_id));
}
