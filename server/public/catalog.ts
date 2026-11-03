import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { displayName } from "@/lib/colour-swatch";
import { db } from "@/server/db";

/**
 * The only way public pages read the catalogue: published products and active variants.
 * Selects fields one by one, so purchase prices and margins can never reach a public page.
 */
const variantSelect = { id: true, sku: true, size: true, price: true, stockQty: true } as const;

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  colourFamily: true,
  colourName: true,
  colourNameMaker: true,
  colourCode: true,
  medium: true,
  category: { select: { name: true } },
  variants: { where: { active: true }, orderBy: { sort: "asc" }, select: variantSelect },
  photos: {
    orderBy: { sort: "asc" },
    take: 1,
    select: { storageKey: true, alt: true, width: true, height: true },
  },
} satisfies Prisma.ProductSelect;

export type CatalogFilters = {
  categorySlug?: string;
  family?: string;
  medium?: string;
  inStock?: boolean;
  q?: string;
  sort?: "name" | "priceAsc" | "priceDesc";
  take?: number;
  skip?: number;
};

/** So % and _ in a search mean themselves. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

/** Folds a search to plain letters: customers often type "zuta" for "Žuta". */
const foldLetters = (text: string) =>
  text.toLowerCase().replace(/[čć]/g, "c").replace(/ž/g, "z").replace(/š/g, "s").replace(/đ/g, "d");

/**
 * Products whose names match with or without č, ć, ž, š, đ. Prisma can't express this, so it's a query of its own.
 * Đ is also compared as "dj", the usual way of typing it. Scanning is fine at catalogue size.
 */
async function productIdsMatching(q: string) {
  const pattern = `%${escapeLike(foldLetters(q))}%`;
  const rows = await db.$queryRaw<{ id: number }[]>`
    SELECT id FROM (
      SELECT id, translate(lower(concat_ws(' ', name, colour_name, colour_name_maker)),
        'ČĆŽŠčćžš', 'cczscczs') AS text
      FROM product
    ) p
    WHERE translate(text, 'Đđ', 'dd') LIKE ${pattern}
       OR replace(replace(text, 'Đ', 'dj'), 'đ', 'dj') LIKE ${pattern}`;
  return rows.map((row) => row.id);
}

/** Filters ready to query, with any search already resolved to products. */
async function resolveSearch(f: CatalogFilters): Promise<CatalogFilters & { matchIds?: number[] }> {
  const q = f.q?.trim();
  return q ? { ...f, q, matchIds: await productIdsMatching(q) } : f;
}

function catalogWhere(f: CatalogFilters & { matchIds?: number[] }): Prisma.ProductWhereInput {
  const search = f.q?.trim();
  return {
    status: "PUBLISHED",
    variants: { some: { active: true, ...(f.inStock ? { stockQty: { gt: 0 } } : {}) } },
    // A top category also shows everything in its subcategories.
    ...(f.categorySlug
      ? { category: { OR: [{ slug: f.categorySlug }, { parent: { slug: f.categorySlug } }] } }
      : {}),
    ...(f.family ? { colourFamily: f.family } : {}),
    ...(f.medium ? { medium: f.medium } : {}),
    ...(search
      ? {
          OR: [
            { id: { in: f.matchIds ?? [] } },
            { variants: { some: { active: true, sku: { contains: escapeLike(search) } } } },
          ],
        }
      : {}),
  };
}

export async function listPublishedProducts(filters: CatalogFilters = {}) {
  const where = catalogWhere(await resolveSearch(filters));
  const take = filters.take ?? 48;
  const skip = filters.skip ?? 0;
  if (filters.sort === "priceAsc" || filters.sort === "priceDesc") {
    const direction = filters.sort === "priceAsc" ? "asc" : "desc";
    const ranked = await db.productVariant.groupBy({
      by: ["productId"],
      where: { active: true, product: where },
      _min: { price: true },
      orderBy: [{ _min: { price: direction } }, { productId: "asc" }],
      take,
      skip,
    });
    const ids = ranked.map((r) => r.productId);
    const rows = await db.product.findMany({ where: { id: { in: ids } }, select: cardSelect });
    return ids.flatMap((id) => rows.find((r) => r.id === id) ?? []);
  }
  return db.product.findMany({ where, select: cardSelect, orderBy: { name: "asc" }, take, skip });
}

/** Staff's chosen products, in their order. Anything hidden or out of stock is simply left out. */
export async function listFeaturedProducts(ids: number[]) {
  const rows = await db.product.findMany({
    where: { ...catalogWhere({ inStock: true }), id: { in: ids } },
    select: cardSelect,
  });
  return ids.flatMap((id) => rows.find((r) => r.id === id) ?? []);
}

/** Products attached to an article, in order, including sold-out ones: the text around them still makes sense. */
export async function listProductsForArticle(ids: number[]) {
  if (ids.length === 0) return [];
  const rows = await db.product.findMany({
    where: { ...catalogWhere({}), id: { in: ids } },
    select: cardSelect,
  });
  return ids.flatMap((id) => rows.find((r) => r.id === id) ?? []);
}

/** The first matches for the search box, with only what its list shows. */
export async function searchSuggestions(q: string, take = 6) {
  const [rows, total] = await Promise.all([
    listPublishedProducts({ q, take }),
    countPublishedProducts({ q }),
  ]);
  return {
    total,
    rows: rows.map((product) => {
      const prices = product.variants.map((v) => v.price.toNumber());
      return {
        slug: product.slug,
        name: displayName(product),
        category: product.category?.name ?? null,
        code: product.colourCode,
        colourFamily: product.colourFamily,
        price: prices.length ? Math.min(...prices) : 0,
        severalPrices: new Set(prices).size > 1,
        inStock: product.variants.some((v) => v.stockQty > 0),
        photo: product.photos[0] ?? null,
      };
    }),
  };
}

export type SearchSuggestions = Awaited<ReturnType<typeof searchSuggestions>>;

export const countPublishedProducts = async (filters: CatalogFilters = {}) =>
  db.product.count({ where: catalogWhere(await resolveSearch(filters)) });

/** Which colour families exist under the current category, so a filter never leads to an empty page. */
export async function familiesIn(categorySlug?: string) {
  const rows = await db.product.groupBy({
    by: ["colourFamily"],
    where: { ...catalogWhere({ categorySlug }), colourFamily: { not: null } },
    _count: true,
  });
  return rows.map((r) => r.colourFamily as string);
}

export async function mediumsIn(categorySlug?: string) {
  const rows = await db.product.groupBy({
    by: ["medium"],
    where: { ...catalogWhere({ categorySlug }), medium: { not: null } },
  });
  return rows.map((r) => r.medium as string);
}

/** Top categories with their subcategories, leaving out any without published products. */
export async function listCategoryTree() {
  const published = { products: { some: { status: "PUBLISHED" as const } } };
  return db.category.findMany({
    where: { parentId: null, OR: [published, { children: { some: published } }] },
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    select: {
      slug: true,
      name: true,
      children: {
        where: published,
        orderBy: [{ sort: "asc" }, { id: "asc" }],
        select: {
          slug: true,
          name: true,
          _count: { select: { products: { where: { status: "PUBLISHED" } } } },
        },
      },
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export function getPublicCategory(slug: string) {
  return db.category.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      parent: { select: { slug: true, name: true } },
      children: { orderBy: [{ sort: "asc" }, { id: "asc" }], select: { slug: true, name: true } },
    },
  });
}

export async function getPublishedProduct(slug: string) {
  return db.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      specs: true,
      finish: true,
      colourName: true,
      colourNameMaker: true,
      colourCode: true,
      colourFamily: true,
      medium: true,
      series: true,
      pigmentCode: true,
      singlePigment: true,
      lightfastness: true,
      opacity: true,
      binder: true,
      categoryId: true,
      lineId: true,
      category: { select: { slug: true, name: true } },
      manufacturer: { select: { slug: true, name: true } },
      line: { select: { name: true } },
      variants: { where: { active: true }, orderBy: { sort: "asc" }, select: variantSelect },
      photos: {
        orderBy: { sort: "asc" },
        select: { storageKey: true, alt: true, width: true, height: true },
      },
    },
  });
}

/** The colours of one line, for moving between them on a product page. */
export function listLineColours(lineId: number) {
  return db.product.findMany({
    where: {
      ...catalogWhere({}),
      lineId,
      NOT: { colourName: null, colourNameMaker: null },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      colourName: true,
      colourNameMaker: true,
      colourFamily: true,
      variants: { where: { active: true }, select: { stockQty: true } },
    },
    orderBy: [{ colourName: "asc" }, { name: "asc" }],
  });
}

export function listRelatedProducts(productId: number, categoryId: number | null, take = 4) {
  if (!categoryId) return Promise.resolve([]);
  return db.product.findMany({
    where: { ...catalogWhere({}), categoryId, id: { not: productId } },
    select: cardSelect,
    orderBy: { name: "asc" },
    take,
  });
}
