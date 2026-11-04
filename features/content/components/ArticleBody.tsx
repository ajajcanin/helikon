import { Fragment, type ReactNode } from "react";
import { MediaImage } from "@/components/atoms/MediaImage";
import { PaintSwatch } from "@/components/atoms/PaintSwatch";
import { ProductImage } from "@/components/atoms/ProductImage";
import { Link } from "@/i18n/navigation";
import { displayName, swatchColour } from "@/lib/colour-swatch";
import { km } from "@/lib/money";
import type { ArticleNode } from "../article-content";

export type InlineProduct = {
  id: number;
  slug: string;
  name: string;
  colourName: string | null;
  colourNameMaker: string | null;
  colourFamily: string | null;
  category: { name: string } | null;
  variants: { price: number; stockQty: number }[];
  photos: { storageKey: string; width: number; height: number; alt: string | null }[];
};

type Labels = { from: (price: string) => string; outOfStock: string; view: string };

function InlineProductCard({ product, labels }: { product: InlineProduct; labels: Labels }) {
  const prices = product.variants.map((v) => v.price);
  const from = prices.length ? km(Math.min(...prices)) : "";
  const inStock = product.variants.some((v) => v.stockQty > 0);
  const photo = product.photos[0];
  const name = displayName(product);
  return (
    <Link
      href={`/proizvod/${product.slug}`}
      className="my-2 flex items-center gap-4 border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 transition-colors hover:border-[var(--border-brass)]"
    >
      {photo ? (
        <ProductImage
          storageKey={photo.storageKey}
          width={photo.width}
          height={photo.height}
          alt=""
          sizes="72px"
          className="h-[72px] w-[72px] flex-none"
        />
      ) : (
        <PaintSwatch color={swatchColour(product.colourFamily)} className="h-[72px] w-[72px] flex-none" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-ui text-[10.5px] tracking-[0.16em] text-[var(--accent-bright)] uppercase">
          {product.category?.name}
        </span>
        <span className="block font-display text-lg leading-snug text-[var(--text-display)]">{name}</span>
        <span className="block font-ui text-sm text-[var(--text-secondary)]">
          {inStock ? (new Set(prices).size > 1 ? labels.from(from) : from) : labels.outOfStock}
        </span>
      </span>
      <span className="font-ui text-xs tracking-[0.08em] whitespace-nowrap text-[var(--accent-bright)] max-[460px]:hidden">
        {labels.view} →
      </span>
    </Link>
  );
}

function inline(nodes: ArticleNode[] | undefined): ReactNode {
  return (nodes ?? []).map((node, i) => {
    const key = `${i}-${node.type}`;
    if (node.type === "hardBreak") return <br key={key} />;
    let out: ReactNode = node.text ?? null;
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold")
        out = <strong className="font-semibold text-[var(--text-display)]">{out}</strong>;
      if (mark.type === "italic") out = <em>{out}</em>;
      if (mark.type === "link") {
        const href = String(mark.attrs?.href ?? "");
        out = (
          <a
            href={href}
            className="text-[var(--accent-bright)] underline underline-offset-2"
            {...(href.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          >
            {out}
          </a>
        );
      }
    }
    return <Fragment key={key}>{out}</Fragment>;
  });
}

/** Renders only what the save step allows. No HTML from the document is ever put on the page as HTML. */
export function ArticleBody({
  doc,
  products,
  labels,
}: {
  doc: ArticleNode;
  products: InlineProduct[];
  labels: Labels;
}) {
  const block = (node: ArticleNode, i: number): ReactNode => {
    const key = `${i}-${node.type}`;
    switch (node.type) {
      case "paragraph":
        return node.content?.length ? <p key={key}>{inline(node.content)}</p> : null;
      case "heading":
        return node.attrs?.level === 3 ? (
          <h3
            key={key}
            className="mt-3 font-display text-xl font-medium tracking-[0.03em] text-[var(--text-display)]"
          >
            {inline(node.content)}
          </h3>
        ) : (
          <h2
            key={key}
            className="mt-5 font-display text-[26px] font-medium tracking-[0.04em] text-[var(--text-display)]"
          >
            {inline(node.content)}
          </h2>
        );
      case "bulletList":
        return (
          <ul key={key} className="list-disc pl-6">
            {node.content?.map(block)}
          </ul>
        );
      case "orderedList":
        return (
          <ol key={key} className="list-decimal pl-6">
            {node.content?.map(block)}
          </ol>
        );
      case "listItem":
        return <li key={key}>{node.content?.map(block)}</li>;
      case "blockquote":
        return (
          <blockquote
            key={key}
            className="border-l-2 border-[var(--accent)] pl-5 text-xl text-[var(--text-display)] italic"
          >
            {node.content?.map(block)}
          </blockquote>
        );
      case "articleImage":
        return (
          <figure key={key} className="my-2">
            <MediaImage
              storageKey={String(node.attrs?.storageKey)}
              width={Number(node.attrs?.width)}
              height={Number(node.attrs?.height)}
              alt={String(node.attrs?.alt ?? "")}
              sizes="(max-width: 768px) 100vw, 720px"
              className="h-auto w-full"
            />
            {node.attrs?.caption ? (
              <figcaption className="mt-2 font-ui text-xs text-[var(--text-muted)]">
                {String(node.attrs.caption)}
              </figcaption>
            ) : null}
          </figure>
        );
      case "productBlock": {
        const product = products.find((p) => p.id === node.attrs?.productId);
        return product ? <InlineProductCard key={key} product={product} labels={labels} /> : null;
      }
      default:
        return null;
    }
  };
  return (
    <div className="flex flex-col gap-4 font-body text-lg leading-relaxed text-[var(--text-secondary)]">
      {doc.content?.map(block)}
    </div>
  );
}
