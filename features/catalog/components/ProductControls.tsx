"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { Input, Select } from "@/components/atoms/Field";
import { useAdminAction } from "@/lib/use-admin-action";
import { changeProductStatus, changeStock } from "../actions";

type Variant = { id: number; sku: string; size: string | null; stockQty: number };

function StockRow({ variant }: { variant: Variant }) {
  const t = useTranslations("products");
  const { run, pending, error } = useAdminAction();
  const [qty, setQty] = useState(String(variant.stockQty));
  const [note, setNote] = useState("");
  return (
    <form
      className="grid items-end gap-3 md:grid-cols-[1fr_1fr_2fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => changeStock({ id: variant.id, qty: Number(qty), note }),
          () => setNote(""),
        );
      }}
    >
      <div className="font-ui text-sm">
        {variant.sku}
        {variant.size ? ` · ${variant.size}` : ""}
      </div>
      <Input
        label={t("newStock")}
        type="number"
        min={0}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />
      <Input label={t("note")} value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" disabled={pending || Number(qty) === variant.stockQty}>
        {t("update")}
      </Button>
      {error && <Caption tone="error">{error}</Caption>}
    </form>
  );
}

export function ProductControls({
  id,
  status,
  variants,
}: {
  id: number;
  status: string;
  variants: Variant[];
}) {
  const t = useTranslations("products");
  const { run, error } = useAdminAction();
  return (
    <div className="mb-4 flex flex-col gap-4 border border-[var(--border-subtle)] p-4">
      <div className="max-w-xs">
        <Select
          label={t("publishing")}
          value={status}
          onChange={(e) =>
            run(() =>
              changeProductStatus({ id, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" }),
            )
          }
        >
          <option value="DRAFT">{t("DRAFT")}</option>
          <option value="PUBLISHED">{t("PUBLISHED")}</option>
          <option value="ARCHIVED">{t("ARCHIVED")}</option>
        </Select>
        <Caption className="mt-1">{t("publishHint")}</Caption>
        {error && <Caption tone="error">{error}</Caption>}
      </div>
      <div>
        <h2 className="mb-2 font-display text-base tracking-[0.04em]">{t("stockTitle")}</h2>
        <div className="flex flex-col gap-3">
          {variants.map((v) => (
            <StockRow key={`${v.id}-${v.stockQty}`} variant={v} />
          ))}
        </div>
      </div>
    </div>
  );
}
