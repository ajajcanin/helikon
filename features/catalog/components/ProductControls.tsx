"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { Select } from "@/components/atoms/Field";
import { useAdminAction } from "@/lib/use-admin-action";
import { changeProductStatus, showVariant } from "../actions";

/** Hides one šifra from the shop, or shows it again, without touching the product's other šifre. */
export function VisibilityButton({
  variant,
  run,
  pending,
}: {
  variant: { id: number; active: boolean };
  run: ReturnType<typeof useAdminAction>["run"];
  pending: boolean;
}) {
  const t = useTranslations("products");
  return (
    <Button
      disabled={pending}
      onClick={() => run(() => showVariant({ id: variant.id, active: !variant.active }))}
    >
      {variant.active ? t("hide") : t("show")}
    </Button>
  );
}

/** Whether the product is in the shop. Its šifre, with stock, are in their own rows. */
export function ProductControls({ id, status }: { id: number; status: string }) {
  const t = useTranslations("products");
  const { run, error } = useAdminAction();
  return (
    <div className="mb-4 border border-[var(--border-subtle)] p-4">
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
    </div>
  );
}
