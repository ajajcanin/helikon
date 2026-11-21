"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { FIELD_CLASS, Input, Select } from "@/components/atoms/Field";
import { useAdminAction } from "@/lib/use-admin-action";
import { moveStock, saveVariantField, storeSale } from "../actions";
import type { ReviewRow } from "../review";
import { VisibilityButton } from "./ProductControls";
import { PhotoSlot } from "./ProductReview";

type Variant = ReviewRow["variants"][number];
type Photo = ReviewRow["photos"][number];
type Sold = { web: number; store: number };

/** Why stock changes, and which way: the reason is the note in the stock history. */
const REASONS = [
  { key: "receive", mode: "add" },
  { key: "count", mode: "set" },
  { key: "damaged", mode: "remove" },
  { key: "returned", mode: "add" },
  { key: "other", mode: "set" },
] as const;
type Reason = (typeof REASONS)[number]["key"];

/** Everything about one šifra in a row: its photo, name or size, price, stock and whether it's in the shop. */
function VariantRow({
  productId,
  variant,
  photo,
  sold,
  motif,
  sizesList,
}: {
  productId: number;
  variant: Variant;
  photo?: Photo;
  sold?: Sold;
  motif: boolean;
  sizesList: string;
}) {
  const t = useTranslations("variants");
  const p = useTranslations("products");
  const { run, pending, error, saved } = useAdminAction();
  const [name, setName] = useState(variant.size ?? "");
  const [price, setPrice] = useState(variant.price);
  const [reason, setReason] = useState<Reason | "">("");
  const [qty, setQty] = useState("");
  const [other, setOther] = useState("");
  const noteId = useId();

  const mode = REASONS.find((r) => r.key === reason)?.mode;
  const amount = Number(qty);
  const stockReady = mode !== undefined && qty !== "" && Number.isInteger(amount) && amount >= 0;
  const after = !stockReady
    ? null
    : mode === "set"
      ? amount
      : mode === "add"
        ? variant.stockQty + amount
        : variant.stockQty - amount;
  const changed =
    name !== (variant.size ?? "") ||
    price !== variant.price ||
    (stockReady && after !== variant.stockQty && (reason !== "other" || other.trim() !== ""));

  function save() {
    run(
      async () => {
        if (name !== (variant.size ?? "")) {
          const res = await saveVariantField({ id: variant.id, field: "size", value: name });
          if (!res.ok) return res;
        }
        if (price !== variant.price) {
          const res = await saveVariantField({ id: variant.id, field: "price", value: price });
          if (!res.ok) return res;
        }
        if (stockReady && mode && after !== variant.stockQty)
          return moveStock({
            id: variant.id,
            mode,
            qty: amount,
            note: reason === "other" ? other : t(`reasons.${reason as Reason}`),
          });
        return { ok: true };
      },
      () => {
        setReason("");
        setQty("");
        setOther("");
      },
    );
  }

  return (
    <li className="grid items-start gap-4 border-b border-[var(--border-subtle)] py-3 sm:grid-cols-[112px_minmax(0,1fr)]">
      <div className="w-28">
        <PhotoSlot productId={productId} variantId={variant.id} photo={photo} wide thumb />
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[64px_minmax(0,1fr)_96px_minmax(0,1.2fr)_96px]">
        <div>
          <span className="mb-1 block font-ui text-xs text-[var(--text-secondary)]">{t("sku")}</span>
          <span className="block py-2 font-ui text-sm">{variant.sku}</span>
        </div>
        <Input
          label={motif ? t("motif") : t("size")}
          value={name}
          list={motif ? undefined : sizesList}
          onChange={(e) => setName(e.target.value)}
        />
        <Input label={t("price")} value={price} onChange={(e) => setPrice(e.target.value)} />
        <Select
          label={t("change", { stock: variant.stockQty })}
          value={reason}
          onChange={(e) => setReason(e.target.value as Reason | "")}
        >
          <option value="">{t("noChange")}</option>
          {REASONS.map((r) => (
            <option key={r.key} value={r.key}>
              {t(`reasons.${r.key}`)}
            </option>
          ))}
        </Select>
        <Input
          label={mode ? t(`qty.${mode}`) : t("qty.none")}
          type="number"
          min={0}
          disabled={!mode}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        {reason === "other" && (
          <div className="sm:col-span-full">
            <label htmlFor={noteId} className="mb-1 block font-ui text-xs text-[var(--text-secondary)]">
              {t("otherNote")}
            </label>
            <input
              id={noteId}
              className={FIELD_CLASS}
              value={other}
              onChange={(e) => setOther(e.target.value)}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 sm:col-span-full">
          <Button variant="primary" disabled={pending || !changed} onClick={save}>
            {t("save")}
          </Button>
          {motif && (
            <Button
              disabled={pending || variant.stockQty < 1}
              onClick={() => run(() => storeSale({ id: variant.id }))}
            >
              {p("storeSale")}
            </Button>
          )}
          <VisibilityButton variant={variant} run={run} pending={pending} />
          <span className="font-ui text-xs text-[var(--text-muted)]">
            {t("inStock", { stock: variant.stockQty })}
            {after !== null && after !== variant.stockQty && ` → ${after}`}
          </span>
          {motif && (
            <span className="font-ui text-xs text-[var(--text-muted)]">
              {p("sold", { web: sold?.web ?? 0, store: sold?.store ?? 0 })}
            </span>
          )}
          {!variant.active && <span className="font-ui text-xs text-[var(--warning)]">{p("hidden")}</span>}
          <span aria-live="polite">
            {error ? <Caption tone="error">{error}</Caption> : saved && <Caption>{t("saved")}</Caption>}
          </span>
        </div>
      </div>
    </li>
  );
}

/**
 * A product's šifre, one row each: sizes, or the motifs of a series. A photo without a size shows on the first row,
 * so older products' photos stay where staff can change them.
 */
export function VariantTable({
  row,
  sold,
  sizes,
}: {
  row: ReviewRow;
  sold: Record<number, Sold>;
  /** Sizes already used in the catalogue, offered while typing so the same size is always written the same way */
  sizes: string[];
}) {
  const sizesList = useId();
  const motif = row.variantKind === "MOTIF";
  const unlinked = row.photos.find((photo) => !row.variants.some((v) => v.id === photo.variantId));
  return (
    <>
      <datalist id={sizesList}>
        {sizes.map((size) => (
          <option key={size} value={size} />
        ))}
      </datalist>
      <ul className="border-t border-[var(--border-subtle)]">
        {row.variants.map((variant, index) => (
          <VariantRow
            key={`${variant.id}-${variant.size}-${variant.price}-${variant.stockQty}-${variant.active}`}
            productId={row.id}
            variant={variant}
            photo={
              row.photos.find((photo) => photo.variantId === variant.id) ??
              (index === 0 ? unlinked : undefined)
            }
            sold={sold[variant.id]}
            motif={motif}
            sizesList={sizesList}
          />
        ))}
      </ul>
    </>
  );
}
