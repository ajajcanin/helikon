"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { useCart } from "@/lib/cart";
import { QuantityStepper } from "./QuantityStepper";

type Variant = { id: number; sku: string; size: string | null; priceLabel: string; stockQty: number };

export function AddToCart({ variants }: { variants: Variant[] }) {
  const t = useTranslations("shop");
  const { add } = useCart();
  const firstInStock = variants.find((v) => v.stockQty > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstInStock?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = variants.find((v) => v.id === selectedId);
  if (!selected) return null;
  const inStock = selected.stockQty > 0;
  return (
    <div>
      {variants.some((v) => v.size) && (
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
                  setSelectedId(v.id);
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
