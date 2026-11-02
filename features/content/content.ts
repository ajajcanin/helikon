import { slugify } from "@/lib/slug";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { CONTENT_PAGES, HOME_KEY, type HomeContent, homeContentSchema, pageKey } from "@/server/content";
import { db } from "@/server/db";
import { setSetting } from "@/server/settings";

export async function saveHomeContent(input: HomeContent, actor: AuditActor) {
  const data = homeContentSchema.parse(input);
  const skus = data.featuredSkus.split(/[\s,]+/).filter(Boolean);
  if (skus.length > 8) throw new UserError("Najviše 8 izdvojenih artikala.");
  if (skus.length) {
    const found = await db.productVariant.findMany({ where: { sku: { in: skus } }, select: { sku: true } });
    const missing = skus.filter((sku) => !found.some((f) => f.sku === sku));
    if (missing.length) throw new UserError(`Ne postoje šifre: ${missing.join(", ")}.`);
  }
  await setSetting(HOME_KEY, { ...data, featuredSkus: skus.join(", ") }, actor);
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
    select: { id: true, title: true, slug: true, publishedAt: true, updatedAt: true },
  });

export const getArticleAdmin = (id: number) => db.article.findUnique({ where: { id } });

export type ArticleInput = { title: string; excerpt: string; body: string; published: boolean };

function parseArticle(input: ArticleInput) {
  const title = input.title.trim();
  if (title.length < 2) throw new UserError("Naslov je prekratak.");
  const body = input.body.trim();
  if (input.published && !body) throw new UserError("Članak bez teksta ne može se objaviti.");
  return { title, excerpt: input.excerpt.trim() || null, body };
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
    const article = await tx.article.create({
      data: { ...data, slug, publishedAt: input.published ? new Date() : null },
    });
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
    // Keeps the original date when an already published article is corrected.
    const publishedAt = input.published ? (before.publishedAt ?? new Date()) : null;
    await tx.article.update({ where: { id }, data: { ...data, publishedAt } });
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
