import "server-only";
import { unstable_cache } from "next/cache";
import { getCompanySettings } from "@/server/company";
import {
  countPublishedArticles,
  getFeaturedIds,
  getHomeContent,
  getPageContent,
  getPublishedArticle,
  listPublishedArticles,
  listPublishedPages,
  listPublishedTags,
} from "@/server/content";
import {
  countPublishedProducts,
  familiesIn,
  getPublicCategory,
  getPublishedProduct,
  listCategoryTree,
  listFeaturedProducts,
  listLineColours,
  listProductsForArticle,
  listPublishedProducts,
  listRelatedProducts,
  mediumsIn,
} from "@/server/public/catalog";
import { CATALOG, COMPANY, CONTENT, JOURNAL, NAV, productTag } from "@/server/shop-cache";

/**
 * What cached pages read. Results are stored as JSON, so everything here must be plain data, and a Date comes back as
 * text. The hour is a backstop for what no save announces, such as a scheduled article or a change made by a script.
 */
const HOUR = 3600;

function cached<A extends unknown[], R>(
  key: string,
  read: (...args: A) => Promise<R>,
  tags: (...args: NoInfer<A>) => string[],
) {
  return (...args: A) =>
    // Stored data outlives a deployment, so the commit is part of the key: new code never reads the old code's shapes.
    unstable_cache(
      () => read(...args),
      [key, JSON.stringify(args), process.env.VERCEL_GIT_COMMIT_SHA ?? ""],
      {
        tags: tags(...args),
        revalidate: HOUR,
      },
    )();
}

const reviveDate = <T extends { publishedAt: Date | null }>(row: T): T => ({
  ...row,
  publishedAt: row.publishedAt && new Date(row.publishedAt),
});

export const cachedCategoryTree = cached("category-tree", listCategoryTree, () => [NAV]);
export const cachedPublishedPages = cached("published-pages", listPublishedPages, () => [NAV]);
export const cachedArticleCount = cached("article-count", countPublishedArticles, () => [NAV]);
export const cachedCategory = cached("category", getPublicCategory, () => [NAV]);
export const cachedCompany = cached("company", getCompanySettings, () => [COMPANY]);

export const cachedHomeContent = cached("home-content", getHomeContent, () => [CONTENT]);
export const cachedFeaturedIds = cached("featured-ids", getFeaturedIds, () => [CONTENT]);
export const cachedPageContent = cached("page-content", getPageContent, () => [CONTENT]);
export const cachedTags = cached("article-tags", listPublishedTags, () => [JOURNAL]);

const articles = cached("articles", listPublishedArticles, () => [JOURNAL]);
export const cachedArticles = async (tag?: string) => (await articles(tag)).map(reviveDate);

const article = cached("article", getPublishedArticle, () => [JOURNAL]);
export async function cachedArticle(slug: string) {
  const row = await article(slug);
  return row && reviveDate(row);
}

export const cachedProducts = cached("products", listPublishedProducts, () => [CATALOG]);
export const cachedProductCount = cached("product-count", countPublishedProducts, () => [CATALOG]);
export const cachedFamilies = cached("families", familiesIn, () => [CATALOG]);
export const cachedMediums = cached("mediums", mediumsIn, () => [CATALOG]);
export const cachedFeaturedProducts = cached("featured-products", listFeaturedProducts, () => [CATALOG]);
export const cachedArticleProducts = cached("article-products", listProductsForArticle, () => [CATALOG]);
export const cachedRelated = cached("related", listRelatedProducts, () => [CATALOG]);
export const cachedLineColours = cached("line-colours", listLineColours, () => [CATALOG]);
export const cachedProduct = cached("product", getPublishedProduct, (slug) => [CATALOG, productTag(slug)]);
