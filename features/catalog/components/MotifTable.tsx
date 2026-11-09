"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { Input } from "@/components/atoms/Field";
import { useAdminAction } from "@/lib/use-admin-action";
import { changeStock, saveVariantField, storeSale } from "../actions";
import type { ReviewRow } from "../review";
import { PhotoSlot } from "./ProductReview";

type Motif = ReviewRow["variants"][number];
type Sold = { web: number; store: number };

/** Everything about one motif in a row: its photo, šifra, name, price and stock. */
function MotifRow({
  productId,
  motif,
  photo,
  sold,
}: {
  productId: number;
  motif: Motif;
  photo?: ReviewRow["photos"][number];
  sold?: Sold;
}) {
  const t = useTranslations("motifs");
  const p = useTranslations("products");
  const { run, pending, error, saved } = useAdminAction();
  const [name, setName] = useState(motif.size ?? "");
  const [price, setPrice] = useState(motif.price);
  const [qty, setQty] = useState(String(motif.stockQty));
  const [note, setNote] = useState("");
  const changed = name !== (motif.size ?? "") || price !== motif.price || Number(qty) !== motif.stockQty;

  function save() {
    run(
      async () => {
        if (name !== (motif.size ?? "")) {
          const res = await saveVariantField({ id: motif.id, field: "size", value: name });
          if (!res.ok) return res;
        }
        if (price !== motif.price) {
          const res = await saveVariantField({ id: motif.id, field: "price", value: price });
          if (!res.ok) return res;
        }
        if (Number(qty) !== motif.stockQty) return changeStock({ id: motif.id, qty: Number(qty), note });
        return { ok: true };
      },
      () => setNote(""),
    );
  }

  return (
    <li className="grid items-start gap-4 border-b border-[var(--border-subtle)] py-3 sm:grid-cols-[112px_minmax(0,1fr)]">
      <div className="w-28">
        <PhotoSlot productId={productId} variantId={motif.id} photo={photo} wide thumb />
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[64px_minmax(0,1fr)_96px_80px_minmax(0,1fr)]">
        <div>
          <span className="mb-1 block font-ui text-xs text-[var(--text-secondary)]">{t("sku")}</span>
          <span className="block py-2 font-ui text-sm">{motif.sku}</span>
        </div>
        <Input label={t("name")} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t("price")} value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input
          label={t("stock")}
          type="number"
          min={0}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <Input label={t("note")} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2 sm:col-span-full">
          <Button variant="primary" disabled={pending || !changed} onClick={save}>
            {t("save")}
          </Button>
          <Button
            disabled={pending || motif.stockQty < 1}
            onClick={() => run(() => storeSale({ id: motif.id }))}
          >
            {p("storeSale")}
          </Button>
          <span className="font-ui text-xs text-[var(--text-muted)]">
            {p("sold", { web: sold?.web ?? 0, store: sold?.store ?? 0 })}
          </span>
          <span aria-live="polite">
            {error ? <Caption tone="error">{error}</Caption> : saved && <Caption>{t("saved")}</Caption>}
          </span>
        </div>
      </div>
    </li>
  );
}

/** A series' motifs, one row each. */
export function MotifTable({ row, sold }: { row: ReviewRow; sold: Record<number, Sold> }) {
  return (
    <ul className="border-t border-[var(--border-subtle)]">
      {row.variants.map((motif) => (
        <MotifRow
          key={`${motif.id}-${motif.size}-${motif.price}-${motif.stockQty}`}
          productId={row.id}
          motif={motif}
          photo={row.photos.find((photo) => photo.variantId === motif.id)}
          sold={sold[motif.id]}
        />
      ))}
    </ul>
  );
}
