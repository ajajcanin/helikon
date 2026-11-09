"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { ProductImage } from "@/components/atoms/ProductImage";
import { useCart } from "@/lib/cart";
import { useSelectedVariant } from "@/lib/selected-variant";
import { QuantityStepper } from "./QuantityStepper";

type Variant = {
  id: number;
  sku: string;
  size: string | null;
  priceLabel: string;
  stockQty: number;
  photo?: { storageKey: string; width: number; height: number };
};

/** Chooses a size, or a motif from pictures when the product is a series of motifs, and adds it to the cart. */
export function AddToCart({ variants, motifs }: { variants: Variant[]; motifs?: boolean }) {
  const t = useTranslations("shop");
  const { add } = useCart();
  const { selectedId, select } = useSelectedVariant();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = variants.find((v) => v.id === selectedId);
  if (!selected) return null;
  const inStock = selected.stockQty > 0;
  return (
    <div>
      {motifs ? (
        <>
          <p className="mb-3 font-ui text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
            {t("motif")}:{" "}
            <span className="text-[var(--text-display)] normal-case">{selected.size ?? selected.sku}</span>
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={v.id === selectedId}
                aria-label={`${t("motif")} ${v.size ?? v.sku}`}
                title={`${v.size ?? ""} · ${t("sku")} ${v.sku}`}
                onClick={() => {
                  select(v.id);
                  setQty(1);
                  setAdded(false);
                }}
                className={`flex flex-col rounded-[2px] border p-1 ${v.id === selectedId ? "border-[var(--accent)] bg-[var(--accent-subtle)]" : "border-[var(--border-subtle)] hover:border-[var(--border-hover)]"} ${v.stockQty > 0 ? "" : "opacity-45"}`}
              >
                {v.photo ? (
                  <ProductImage
                    storageKey={v.photo.storageKey}
                    width={v.photo.width}
                    height={v.photo.height}
                    alt=""
                    sizes="96px"
                    className="aspect-square w-full"
                  />
                ) : (
                  <span className="aspect-square w-full bg-[var(--product-tile)]" />
                )}
                <span className="mt-1 truncate text-center font-ui text-[11px]">{v.size ?? v.sku}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        variants.some((v) => v.size) && (
          <>
            <p className="mb-3 font-ui text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              {t("size")}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={v.id === selectedId}
                  onClick={() => {
                    select(v.id);
                    setQty(1);
                    setAdded(false);
                  }}
                  className={`flex flex-col items-start rounded-[2px] border px-4 py-2.5 text-left ${v.id === selectedId ? "border-[var(--accent)] bg-[var(--accent-subtle)]" : "border-[var(--border-strong)] hover:border-[var(--border-hover)]"}`}
                >
                  <span className="font-body text-base">{v.size ?? selected.sku}</span>
                  <span className="font-ui text-[13px] text-[var(--text-muted)]">{v.priceLabel}</span>
                </button>
              ))}
            </div>
          </>
        )
      )}
      <p className="mt-5 font-display text-2xl text-[var(--text-display)]">{selected.priceLabel}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3.5">
        <QuantityStepper
          value={qty}
          max={Math.max(selected.stockQty, 1)}
          onChange={(value) => {
            setQty(value);
            setAdded(false);
          }}
        />
        <Button
          variant="primary"
          disabled={!inStock}
          className="h-12 min-w-[200px] flex-1 tracking-[0.08em]"
          onClick={() => {
            add(selected.id, qty);
            setAdded(true);
          }}
        >
          {t("add")}
        </Button>
      </div>
      <p
        aria-live="polite"
        className={`mt-3.5 font-ui text-[13px] ${added || inStock ? "text-[var(--success)]" : "text-[var(--warning)]"}`}
      >
        {added ? t("added") : inStock ? t("available") : t("unavailable")}
        {!added && ` · ${t("sku")} ${selected.sku}`}
      </p>
    </div>
  );
}
