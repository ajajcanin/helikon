"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { Checkbox, FIELD_CLASS, Input } from "@/components/atoms/Field";
import { useAdminAction } from "@/lib/use-admin-action";
import type { CompanySettings } from "@/server/company";
import { saveCompany } from "../actions";

const COMPANY_FIELDS = [
  "legalName",
  "address",
  "city",
  "phone",
  "email",
  "web",
  "court",
  "mbs",
  "jib",
  "bankAccount",
] as const;

export function CompanyForm({ initial }: { initial: CompanySettings }) {
  const t = useTranslations("settings");
  const c = useTranslations("common");
  const { run, pending, error, saved } = useAdminAction();
  const [form, setForm] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveCompany(form));
      }}
    >
      <h2 className="font-display text-base tracking-[0.04em]">{t("company")}</h2>
      <p className="mt-1 mb-3 text-[var(--text-muted)]">{t("companyHint")}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {COMPANY_FIELDS.map((field) => (
          <Input
            key={field}
            label={t(field)}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          />
        ))}
      </div>
      <div className="mt-4 grid items-end gap-3 md:grid-cols-2">
        <Checkbox
          label={t("inPdv")}
          checked={form.inPdv}
          onChange={(e) => setForm({ ...form, inPdv: e.target.checked })}
        />
        <Input
          label={t("pdvNumber")}
          value={form.pdvNumber}
          onChange={(e) => setForm({ ...form, pdvNumber: e.target.value })}
        />
      </div>
      <h2 className="mt-8 mb-3 font-display text-base tracking-[0.04em]">{t("shop")}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label={t("orderEmail")}
          value={form.orderEmail}
          onChange={(e) => setForm({ ...form, orderEmail: e.target.value })}
        />
        <Input
          label={t("invoiceNote")}
          value={form.invoiceNote}
          onChange={(e) => setForm({ ...form, invoiceNote: e.target.value })}
        />
        <div className="md:col-span-2">
          <label htmlFor="opening-hours" className="mb-1 block font-ui text-xs text-[var(--text-secondary)]">
            {t("openingHours")}
          </label>
          <textarea
            id="opening-hours"
            rows={3}
            value={form.openingHours}
            onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
            className={FIELD_CLASS}
          />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {c("save")}
        </Button>
        {saved && <Caption>{c("saved")}</Caption>}
        {error && <Caption tone="error">{error}</Caption>}
      </div>
    </form>
  );
}
