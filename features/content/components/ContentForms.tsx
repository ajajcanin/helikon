"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { FIELD_CLASS, Input } from "@/components/atoms/Field";
import { useAdminAction } from "@/lib/use-admin-action";
import type { HomeContent } from "@/server/content";
import { saveHome, savePage } from "../actions";

function Area({
  label,
  hint,
  value,
  rows,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  rows: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-ui text-xs text-[var(--text-secondary)]">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_CLASS}
      />
      {hint && <span className="mt-1 block font-ui text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}

function SaveRow({ pending, saved, error }: { pending: boolean; saved: boolean; error: string | null }) {
  const c = useTranslations("common");
  return (
    <div className="mt-4 flex items-center gap-3">
      <Button type="submit" variant="primary" disabled={pending}>
        {c("save")}
      </Button>
      {saved && !error && <Caption>{c("saved")}</Caption>}
      {error && <Caption tone="error">{error}</Caption>}
    </div>
  );
}

export function HomeForm({ initial }: { initial: HomeContent }) {
  const t = useTranslations("content");
  const { run, pending, error, saved } = useAdminAction();
  const [form, setForm] = useState(initial);
  const input = (field: keyof HomeContent) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value }),
  });
  const area = (field: keyof HomeContent) => ({
    value: form[field],
    onChange: (value: string) => setForm({ ...form, [field]: value }),
  });
  const group = "mt-6 mb-3 font-display text-base tracking-[0.04em]";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveHome(form));
      }}
    >
      <h3 className={group}>{t("hero")}</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <Input label={t("eyebrow")} {...input("eyebrow")} />
        <Input label={t("titleFirst")} {...input("titleFirst")} />
        <Input label={t("titleSecond")} {...input("titleSecond")} />
      </div>
      <div className="mt-3">
        <Area label={t("text")} rows={2} {...area("text")} />
      </div>
      <h3 className={group}>{t("shelves")}</h3>
      <div className="grid gap-3">
        <Input label={t("sectionTitle")} {...input("shelvesTitle")} />
        <Area label={t("text")} rows={2} {...area("shelvesText")} />
      </div>
      <h3 className={group}>{t("featured")}</h3>
      <div className="grid gap-3">
        <Input label={t("sectionTitle")} {...input("featuredTitle")} />
        <Input label={t("featuredSkus")} placeholder="1001, 1238, 2402" {...input("featuredSkus")} />
        <p className="font-ui text-xs text-[var(--text-muted)]">{t("featuredHint")}</p>
      </div>
      <h3 className={group}>{t("visit")}</h3>
      <div className="grid gap-3">
        <Input label={t("sectionTitle")} {...input("visitTitle")} />
        <Area label={t("text")} rows={2} {...area("visitText")} />
      </div>
      <SaveRow pending={pending} saved={saved} error={error} />
    </form>
  );
}

export function PageForm({
  slug,
  label,
  title,
  body,
}: {
  slug: string;
  label: string;
  title: string;
  body: string;
}) {
  const t = useTranslations("content");
  const { run, pending, error, saved } = useAdminAction();
  const [form, setForm] = useState({ title, body });
  return (
    <form
      className="border border-[var(--border-subtle)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => savePage({ slug, ...form }));
      }}
    >
      <h3 className="mb-3 font-display text-base tracking-[0.04em]">
        {label}{" "}
        <span className="font-ui text-xs tracking-normal text-[var(--text-muted)]">
          /{slug} · {form.body.trim() ? t("visible") : t("hidden")}
        </span>
      </h3>
      <div className="grid gap-3">
        <Input
          label={t("pageTitle")}
          placeholder={label}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Area
          label={t("body")}
          hint={t("bodyHint")}
          rows={8}
          value={form.body}
          onChange={(value) => setForm({ ...form, body: value })}
        />
      </div>
      <SaveRow pending={pending} saved={saved} error={error} />
    </form>
  );
}
