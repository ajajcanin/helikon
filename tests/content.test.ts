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
  listPublishedTags,
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
  const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Tekst" }] }] };
  const draft = {
    title: "Šta je pigment",
    excerpt: "",
    content: doc,
    tags: [],
    publishedAt: null,
    cover: null,
    productIds: [],
  };

  it("shows an article only once published, keeps its address, and waits for a future date", async () => {
    const created = await createArticle(draft, actor);
    expect(created.slug).toBe("sta-je-pigment");
    expect(await listPublishedArticles()).toEqual([]);
    expect(await getPublishedArticle(created.slug)).toBeNull();

    const when = new Date(Date.now() - 1000).toISOString();
    await updateArticle(created.id, { ...draft, title: "Novi naslov", publishedAt: when }, actor);
    expect((await getPublishedArticle(created.slug))?.title).toBe("Novi naslov");

    const later = new Date(Date.now() + 86_400_000).toISOString();
    await updateArticle(created.id, { ...draft, publishedAt: later }, actor);
    expect(await getPublishedArticle(created.slug)).toBeNull();

    await updateArticle(created.id, draft, actor);
    expect(await getPublishedArticle(created.slug)).toBeNull();
  });

  it("gives a repeated title its own address, needs content to publish, and deletes", async () => {
    const one = await createArticle(draft, actor);
    const two = await createArticle(draft, actor);
    expect(two.slug).toBe("sta-je-pigment-2");
    const now = new Date().toISOString();
    await expect(
      createArticle({ ...draft, content: { type: "doc", content: [] }, publishedAt: now }, actor),
    ).rejects.toThrow(/teksta/);
    await deleteArticle(one.id, actor);
    await expect(deleteArticle(one.id, actor)).rejects.toThrow();
  });

  it("keeps tags tidy, filters by tag, and doesn't repeat a product placed in the text", async () => {
    const withProduct = {
      type: "doc",
      content: [...doc.content, { type: "productBlock", attrs: { productId: 7, label: "x" } }],
    };
    const created = await createArticle(
      {
        ...draft,
        content: withProduct,
        tags: ["Vodič", " vodič ", "Pigmenti"],
        productIds: [7, 8, 8],
        publishedAt: new Date(Date.now() - 1000).toISOString(),
      },
      actor,
    );
    expect(created.tags).toEqual(["Vodič", "Pigmenti"]);
    expect(created.productIds).toEqual([8]);
    expect((await listPublishedArticles("Pigmenti")).length).toBe(1);
    expect((await listPublishedArticles("Ostalo")).length).toBe(0);
    expect(await listPublishedTags()).toEqual(["Pigmenti", "Vodič"]);
  });

  it("refuses a cover that isn't one of our uploads", async () => {
    const cover = { storageKey: "https://zlo.example/x", width: 10, height: 10, alt: "" };
    await expect(createArticle({ ...draft, cover }, actor)).rejects.toThrow(/slika/);
  });
});
