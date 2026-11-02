// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  cleanTags,
  docProductIds,
  docText,
  readingMinutes,
  sanitizeDoc,
} from "@/features/content/article-content";

const KEY = "articles/6b1f4f7e-0d3a-4a55-9d67-3f1c2b7a9e10";

describe("sanitizeDoc", () => {
  it("keeps what the editor makes", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Naslov" }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Tekst",
              marks: [{ type: "bold" }, { type: "link", attrs: { href: "https://helikon.ba" } }],
            },
          ],
        },
        { type: "articleImage", attrs: { storageKey: KEY, width: 640, height: 480, alt: "a", caption: "b" } },
        { type: "productBlock", attrs: { productId: 5, label: "Boja" } },
      ],
    };
    expect(sanitizeDoc(doc)).toEqual(doc);
  });

  it("drops dangerous links, unknown blocks and foreign images, keeping the text inside", () => {
    const clean = sanitizeDoc({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }, { type: "evil" }],
            },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "y", marks: [{ type: "link", attrs: { href: "//zlo.example" } }] }],
        },
        { type: "iframe", attrs: { src: "https://zlo.example" } },
        { type: "wrapper", content: [{ type: "paragraph", content: [{ type: "text", text: "sačuvano" }] }] },
        { type: "articleImage", attrs: { storageKey: "../../tajna", width: 10, height: 10 } },
        { type: "productBlock", attrs: { productId: "1; DROP TABLE" } },
      ],
    });
    expect(clean).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "x" }] },
        { type: "paragraph", content: [{ type: "text", text: "y" }] },
        { type: "paragraph", content: [{ type: "text", text: "sačuvano" }] },
      ],
    });
    expect(sanitizeDoc("nije dokument")).toEqual({ type: "doc", content: [] });
  });
});

describe("article helpers", () => {
  it("reads text and products, and estimates reading time", () => {
    const doc = sanitizeDoc({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Jedan dva" }] },
        {
          type: "bulletList",
          content: [{ type: "listItem", content: [{ type: "productBlock", attrs: { productId: 3 } }] }],
        },
        { type: "productBlock", attrs: { productId: 9 } },
      ],
    });
    expect(docText(doc)).toContain("Jedan dva");
    expect(docProductIds(doc)).toEqual([3, 9]);
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("riječ ".repeat(1000))).toBe(5);
  });

  it("cleans tags: no repeats or blanks, at most 5", () => {
    expect(cleanTags([" A ", "a", "", "B", "C", "D", "E", "F"])).toEqual(["A", "B", "C", "D", "E"]);
  });
});
