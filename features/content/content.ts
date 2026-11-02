import { slugify } from "@/lib/slug";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { CONTENT_PAGES, HOME_KEY, type HomeContent, homeContentSchema, pageKey } from "@/server/content";
import { db } from "@/server/db";
import { setSetting } from "@/server/settings";
import { cleanTags, docHasImages, docProductIds, docText, sanitizeDoc } from "./article-content";

export async function saveHomeContent(input: HomeContent, actor: AuditActor) {
  const data = homeContentSchema.parse(input);
  await setSetting(HOME_KEY, data, actor);
}

export async function savePageContent(
  slug: string,
  input: { title: string; body: string },
  actor: AuditActor,
) {
  if (!CONTENT_PAGES.some((p) => p.slug === slug)) throw new UserError("Ta stranica ne postoji.");
  await setSetting(pageKey(slug), { title: input.title.trim(), body: input.body.trim() }, actor);
}

export const listArticlesAdmin = () =>
  db.article.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
      updatedAt: true,
      tags: true,
      coverKey: true,
      coverWidth: true,
      coverHeight: true,
    },
  });

export const getArticleAdmin = (id: number) => db.article.findUnique({ where: { id } });

/** Names for the end-of-article list in the admin. */
export async function productLabels(ids: number[]) {
  const rows = await db.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, colourName: true, colourNameMaker: true },
  });
  return ids.flatMap((id) => {
    const row = rows.find((r) => r.id === id);
    return row ? [{ id, name: row.colourName ?? row.colourNameMaker ?? row.name }] : [];
  });
}

export const knownTags = async () => {
  const rows = await db.article.findMany({ select: { tags: true } });
  return [...new Set(rows.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b, "bs"));
};

export type ArticleInput = {
  title: string;
  excerpt: string;
  content: unknown;
  tags: string[];
  /** ISO date. Empty keeps it a draft; a future date publishes it then. */
  publishedAt: string | null;
  cover: { storageKey: string; width: number; height: number; alt: string } | null;
  productIds: number[];
};

function parseArticle(input: ArticleInput) {
  const title = input.title.trim();
  if (title.length < 2) throw new UserError("Naslov je prekratak.");
  const content = sanitizeDoc(input.content);
  const body = docText(content);
  const inText = docProductIds(content);
  if (input.publishedAt && !body && !docHasImages(content) && inText.length === 0) {
    throw new UserError("Članak bez teksta ne može se objaviti.");
  }
  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  if (publishedAt && Number.isNaN(publishedAt.getTime())) throw new UserError("Datum objave nije ispravan.");
  const cover = input.cover;
  if (cover && !/^articles\/[0-9a-f-]{36}$/.test(cover.storageKey)) throw new UserError("Neispravna slika.");
  return {
    title,
    excerpt: input.excerpt.trim() || null,
    body,
    content: content as object,
    tags: cleanTags(input.tags),
    publishedAt,
    coverKey: cover?.storageKey ?? null,
    coverWidth: cover?.width ?? null,
    coverHeight: cover?.height ?? null,
    coverAlt: cover?.alt.trim() || null,
    productIds: [...new Set(input.productIds)].filter((id) => !inText.includes(id)).slice(0, 12),
  };
}

/** The address comes from the first title and stays, so links keep working after a rename. */
export async function createArticle(input: ArticleInput, actor: AuditActor) {
  const data = parseArticle(input);
  const base = slugify(data.title);
  if (!base) throw new UserError("Naslov mora imati slova ili brojeve.");
  return db.$transaction(async (tx) => {
    let slug = base;
    for (let n = 2; await tx.article.findUnique({ where: { slug }, select: { id: true } }); n++)
      slug = `${base}-${n}`;
    const article = await tx.article.create({ data: { ...data, slug } });
    await audit(tx, actor, {
      action: "create",
      table: "article",
      recordId: article.id,
      summary: `Novi članak: ${data.title}`,
    });
    return article;
  });
}

export async function updateArticle(id: number, input: ArticleInput, actor: AuditActor) {
  const data = parseArticle(input);
  await db.$transaction(async (tx) => {
    const before = await tx.article.findUnique({ where: { id } });
    if (!before) throw new UserError("Članak ne postoji.");
    await tx.article.update({ where: { id }, data });
    await audit(tx, actor, {
      action: "update",
      table: "article",
      recordId: id,
      summary: `Članak izmijenjen: ${data.title}`,
    });
  });
}

export async function deleteArticle(id: number, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const article = await tx.article.findUnique({ where: { id } });
    if (!article) throw new UserError("Članak ne postoji.");
    await tx.article.delete({ where: { id } });
    await audit(tx, actor, {
      action: "delete",
      table: "article",
      recordId: id,
      summary: `Obrisan članak: ${article.title}`,
    });
  });
}
