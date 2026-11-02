/**
 * The editor's document, as stored. Everything is rebuilt from an allow-list on save, so whatever a browser sends,
 * only these blocks reach the public page, and a link can't run code.
 */
export type ArticleNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ArticleNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

const BLOCKS_WITH_CHILDREN = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
]);
const SAFE_LINK = /^(https?:\/\/|mailto:|\/(?!\/))/i;

function cleanMarks(marks: unknown) {
  if (!Array.isArray(marks)) return undefined;
  const clean = marks.flatMap((mark): NonNullable<ArticleNode["marks"]> => {
    if (mark?.type === "bold" || mark?.type === "italic") return [{ type: mark.type }];
    if (mark?.type === "link" && typeof mark.attrs?.href === "string" && SAFE_LINK.test(mark.attrs.href)) {
      return [{ type: "link", attrs: { href: mark.attrs.href } }];
    }
    return [];
  });
  return clean.length ? clean : undefined;
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

function cleanNode(node: unknown): ArticleNode[] {
  if (!node || typeof node !== "object") return [];
  const n = node as ArticleNode;
  if (n.type === "text") {
    if (typeof n.text !== "string" || !n.text) return [];
    const marks = cleanMarks(n.marks);
    return [{ type: "text", text: n.text.slice(0, 20000), ...(marks ? { marks } : {}) }];
  }
  if (n.type === "hardBreak") return [{ type: "hardBreak" }];
  if (n.type === "articleImage") {
    const { storageKey, width, height } = n.attrs ?? {};
    if (typeof storageKey !== "string" || !/^articles\/[0-9a-f-]{36}$/.test(storageKey)) return [];
    if (!Number.isInteger(width) || !Number.isInteger(height)) return [];
    return [
      {
        type: "articleImage",
        attrs: {
          storageKey,
          width,
          height,
          alt: text(n.attrs?.alt, 300),
          caption: text(n.attrs?.caption, 300),
        },
      },
    ];
  }
  if (n.type === "productBlock") {
    const productId = n.attrs?.productId;
    if (!Number.isInteger(productId) || (productId as number) <= 0) return [];
    return [{ type: "productBlock", attrs: { productId, label: text(n.attrs?.label, 200) } }];
  }
  if (!BLOCKS_WITH_CHILDREN.has(n.type)) {
    // An unknown wrapper is dropped, but what's inside it isn't lost.
    return Array.isArray(n.content) ? n.content.flatMap(cleanNode) : [];
  }
  const content = Array.isArray(n.content) ? n.content.flatMap(cleanNode) : [];
  if (n.type === "heading") {
    const level = n.attrs?.level === 3 ? 3 : 2;
    return [{ type: "heading", attrs: { level }, content }];
  }
  return [{ type: n.type, content }];
}

export function sanitizeDoc(doc: unknown): ArticleNode {
  const content = (doc as ArticleNode | null)?.content;
  return { type: "doc", content: Array.isArray(content) ? content.flatMap(cleanNode) : [] };
}

/** Plain text of the document, for reading time and for checking it isn't empty. */
export function docText(node: ArticleNode | null | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "articleImage") return String(node.attrs?.caption ?? "");
  return (node.content ?? [])
    .map(docText)
    .join(node.type === "doc" ? "\n" : " ")
    .trim();
}

/** Products placed in the text, in order. */
export function docProductIds(node: ArticleNode | null | undefined): number[] {
  if (!node) return [];
  if (node.type === "productBlock") return [node.attrs?.productId as number];
  return (node.content ?? []).flatMap(docProductIds);
}

export const docHasImages = (node: ArticleNode | null | undefined): boolean =>
  !!node && (node.type === "articleImage" || (node.content ?? []).some(docHasImages));

const WORDS_PER_MINUTE = 200;

export function readingMinutes(plain: string): number {
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim().slice(0, 40))
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}
