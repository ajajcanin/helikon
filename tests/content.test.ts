// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createArticle,
  deleteArticle,
  saveHomeContent,
  savePageContent,
  updateArticle,
} from "@/features/content/content";
import { PlainText } from "@/lib/plain-text";
import {
  getHomeContent,
  getPublishedArticle,
  HOME_DEFAULTS,
  listPublishedArticles,
  listPublishedPages,
} from "@/server/content";
import { db } from "@/server/db";
import { resetDb } from "./helpers";

const actor = { id: null, name: "Klijent" };

beforeEach(async () => {
  await resetDb();
  await db.setting.deleteMany();
  await db.article.deleteMany();
});

describe("homepage content", () => {
  it("starts from defaults and saves changes", async () => {
    expect(await getHomeContent()).toEqual(HOME_DEFAULTS);
    await saveHomeContent({ ...HOME_DEFAULTS, titleFirst: "Novi" }, actor);
    expect((await getHomeContent()).titleFirst).toBe("Novi");
    await expect(saveHomeContent({ ...HOME_DEFAULTS, titleFirst: " " }, actor)).rejects.toThrow();
  });
});

describe("pages", () => {
  it("is hidden until it has text", async () => {
    expect(await listPublishedPages()).toEqual([]);
    await savePageContent("o-nama", { title: "", body: "  " }, actor);
    expect(await listPublishedPages()).toEqual([]);
    await savePageContent("o-nama", { title: "", body: "Tekst" }, actor);
    expect(await listPublishedPages()).toEqual([{ slug: "o-nama", title: "O nama" }]);
    await expect(savePageContent("nepoznata", { title: "", body: "x" }, actor)).rejects.toThrow();
  });

  it("renders headings, lists and paragraphs, and never runs what was typed", () => {
    const html = renderToStaticMarkup(
      PlainText({ text: "## Naslov\n\nPrvi\nred\n\n- a\n- b\n\n<script>alert(1)</script>" }),
    );
    expect(html).toContain("<h2");
    expect(html).toContain("Prvi red</p>");
    expect(html).toContain("<li>a</li>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("journal", () => {
  const draft = { title: "Šta je pigment", excerpt: "", body: "Tekst", published: false };

  it("shows an article only once published, keeps its address and first date", async () => {
    const created = await createArticle(draft, actor);
    expect(created.slug).toBe("sta-je-pigment");
    expect(await listPublishedArticles()).toEqual([]);
    expect(await getPublishedArticle(created.slug)).toBeNull();

    await updateArticle(created.id, { ...draft, title: "Novi naslov", published: true }, actor);
    const first = await getPublishedArticle(created.slug);
    expect(first?.title).toBe("Novi naslov");
    await updateArticle(created.id, { ...draft, title: "Opet", published: true }, actor);
    expect((await getPublishedArticle(created.slug))?.publishedAt).toEqual(first?.publishedAt);

    await updateArticle(created.id, { ...draft, published: false }, actor);
    expect(await getPublishedArticle(created.slug)).toBeNull();
  });

  it("gives a repeated title its own address, needs text to publish, and deletes", async () => {
    const one = await createArticle(draft, actor);
    const two = await createArticle(draft, actor);
    expect(two.slug).toBe("sta-je-pigment-2");
    await expect(createArticle({ ...draft, body: "", published: true }, actor)).rejects.toThrow(/teksta/);
    await deleteArticle(one.id, actor);
    await expect(deleteArticle(one.id, actor)).rejects.toThrow();
  });
});
