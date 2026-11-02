import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
import { getSetting } from "@/server/settings";

const HOME_KEY = "content:home";

export const homeContentSchema = z.object({
  eyebrow: z.string().trim().max(80),
  titleFirst: z.string().trim().min(1, "Upišite naslov.").max(40),
  titleSecond: z.string().trim().max(40),
  text: z.string().trim().max(400),
  shelvesTitle: z.string().trim().min(1, "Upišite naslov.").max(80),
  shelvesText: z.string().trim().max(300),
  featuredTitle: z.string().trim().min(1, "Upišite naslov.").max(80),
  visitTitle: z.string().trim().min(1, "Upišite naslov.").max(80),
  visitText: z.string().trim().max(300),
});

export type HomeContent = z.infer<typeof homeContentSchema>;

export const HOME_DEFAULTS: HomeContent = {
  eyebrow: "Sarajevo · Kuća umjetničkih materijala",
  titleFirst: "Izvor",
  titleSecond: "boje",
  text: "Akrilne i uljane boje, efekti, pozlata i pribor, birani za one koji od praznog platna vide početak.",
  shelvesTitle: "Odjeljenja radnje",
  shelvesText: "Razvrstano kao u apoteci pigmenata: svaka polica svoj red, svaka boja svoje mjesto.",
  featuredTitle: "Iz naše ponude",
  visitTitle: "Boja se bira uživo",
  visitText: "Dođite u našu radnju u Sarajevu, uzmite uzorke u ruke i vidite boju pod pravom svjetlošću.",
};

export async function getHomeContent(): Promise<HomeContent> {
  return { ...HOME_DEFAULTS, ...(await getSetting<Partial<HomeContent>>(HOME_KEY, {})) };
}

export { HOME_KEY };

export const FEATURED_KEY = "content:featured";
export const FEATURED_MAX = 8;

/** The homepage's chosen products, in order. Empty: the shop picks products itself. */
export async function getFeaturedIds(): Promise<number[]> {
  return (await getSetting<{ ids?: number[] }>(FEATURED_KEY, {})).ids ?? [];
}

/** Pages with fixed addresses. Each stays hidden until it has text, so no empty page is ever linked. */
export const CONTENT_PAGES = [
  { slug: "o-nama", label: "O nama" },
  { slug: "uslovi", label: "Uslovi kupovine" },
  { slug: "dostava-i-povrat", label: "Dostava i povrat" },
  { slug: "privatnost", label: "Privatnost" },
] as const;

export type ContentPageSlug = (typeof CONTENT_PAGES)[number]["slug"];

export const pageKey = (slug: string) => `content:page:${slug}`;

export const getPageContent = (slug: string) =>
  getSetting<{ title?: string; body?: string }>(pageKey(slug), {});

/** Which pages have text, for the footer and menu. */
export async function listPublishedPages() {
  const rows = await db.setting.findMany({
    where: { key: { in: CONTENT_PAGES.map((p) => pageKey(p.slug)) } },
  });
  return CONTENT_PAGES.flatMap((page) => {
    const value = rows.find((r) => r.key === pageKey(page.slug))?.value as
      | { title?: string; body?: string }
      | undefined;
    return value?.body?.trim() ? [{ slug: page.slug, title: value.title?.trim() || page.label }] : [];
  });
}

const articleSelect = {
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  tags: true,
  body: true,
  coverKey: true,
  coverWidth: true,
  coverHeight: true,
  coverAlt: true,
} as const;

export function listPublishedArticles(tag?: string, take = 50) {
  return db.article.findMany({
    where: { publishedAt: { not: null, lte: new Date() }, ...(tag ? { tags: { has: tag } } : {}) },
    orderBy: { publishedAt: "desc" },
    select: articleSelect,
    take,
  });
}

export async function listPublishedTags() {
  const rows = await db.article.findMany({
    where: { publishedAt: { not: null, lte: new Date() } },
    select: { tags: true },
  });
  return [...new Set(rows.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b, "bs"));
}

export const countPublishedArticles = () =>
  db.article.count({ where: { publishedAt: { not: null, lte: new Date() } } });

export function getPublishedArticle(slug: string) {
  return db.article.findFirst({
    where: { slug, publishedAt: { not: null, lte: new Date() } },
    select: { ...articleSelect, content: true, productIds: true },
  });
}
