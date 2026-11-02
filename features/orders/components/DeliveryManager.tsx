"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { Checkbox, Input } from "@/components/atoms/Field";
import { useAdminAction } from "@/lib/use-admin-action";
import { addDelivery, editDelivery, removeDelivery } from "../actions";

type Rate = { id?: number; name: string; price: string; freeFrom: string; active: boolean };

function RateForm({ rate, isNew }: { rate: Rate; isNew?: boolean }) {
  const t = useTranslations("deliveryRates");
  const c = useTranslations("common");
  const { run, pending, error, saved } = useAdminAction();
  const [form, setForm] = useState(rate);
  const set = (patch: Partial<Rate>) => setForm({ ...form, ...patch });
  const input = { name: form.name, price: form.price, freeFrom: form.freeFrom, active: form.active };
  return (
    <form
      className="border border-[var(--border-subtle)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (isNew)
          run(
            () => addDelivery(input),
            () => setForm(rate),
          );
        else run(() => editDelivery({ id: rate.id!, ...input }));
      }}
    >
      <div className="grid gap-3 md:grid-cols-3">
        <Input label={c("name")} value={form.name} onChange={(e) => set({ name: e.target.value })} />
        <Input
          label={t("price")}
          inputMode="decimal"
          value={form.price}
          onChange={(e) => set({ price: e.target.value })}
        />
        <Input
          label={t("freeFrom")}
          inputMode="decimal"
          value={form.freeFrom}
          onChange={(e) => set({ freeFrom: e.target.value })}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Checkbox
          label={t("active")}
          checked={form.active}
          onChange={(e) => set({ active: e.target.checked })}
        />
        <Button type="submit" variant="primary" disabled={pending}>
          {isNew ? c("add") : c("save")}
        </Button>
        {!isNew && (
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (window.confirm(c("confirmDelete"))) run(() => removeDelivery({ id: rate.id! }));
            }}
          >
            {c("delete")}
          </Button>
        )}
        {saved && !isNew && <Caption>{c("saved")}</Caption>}
        {error && <Caption tone="error">{error}</Caption>}
      </div>
    </form>
  );
}

export function DeliveryManager({ rates }: { rates: (Rate & { id: number })[] }) {
  const t = useTranslations("deliveryRates");
  return (
    <div className="flex flex-col gap-4">
      {rates.map((r) => (
        <RateForm key={r.id} rate={r} />
      ))}
      <h2 className="mt-4 font-display text-base tracking-[0.04em]">{t("new")}</h2>
      <RateForm isNew rate={{ name: "", price: "", freeFrom: "", active: true }} />
    </div>
  );
}
