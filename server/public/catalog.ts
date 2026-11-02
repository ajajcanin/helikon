import "server-only";
import type { Prisma } from "@/generated/prisma/client";
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

function catalogWhere(f: CatalogFilters): Prisma.ProductWhereInput {
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
            { name: { contains: search, mode: "insensitive" } },
            { colourName: { contains: search, mode: "insensitive" } },
            { colourNameMaker: { contains: search, mode: "insensitive" } },
            { variants: { some: { active: true, sku: { contains: search } } } },
          ],
        }
      : {}),
  };
}

export async function listPublishedProducts(filters: CatalogFilters = {}) {
  const where = catalogWhere(filters);
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

export const countPublishedProducts = (filters: CatalogFilters = {}) =>
  db.product.count({ where: catalogWhere(filters) });

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

export function listRelatedProducts(productId: number, categoryId: number | null, take = 4) {
  if (!categoryId) return Promise.resolve([]);
  return db.product.findMany({
    where: { ...catalogWhere({}), categoryId, id: { not: productId } },
    select: cardSelect,
    orderBy: { name: "asc" },
    take,
  });
}
