"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { Checkbox, FIELD_CLASS, Input } from "@/components/atoms/Field";
import { addArticle, editArticle, removeArticle } from "../actions";

type Props = { id?: number; title?: string; excerpt?: string; body?: string; published?: boolean };

export function ArticleForm({ id, title = "", excerpt = "", body = "", published = false }: Props) {
  const t = useTranslations("content");
  const c = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ title, excerpt, body, published });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    start(async () => {
      if (id) {
        const res = await editArticle({ id, ...form });
        if (!res.ok) setError(res.error);
        else {
          setSaved(true);
          router.refresh();
        }
        return;
      }
      const res = await addArticle(form);
      if (!res.ok) setError(res.error);
      else router.replace(`/admin/dnevnik/${res.data.id}`);
    });
  }

  function remove() {
    if (!id || !window.confirm(c("confirmDelete"))) return;
    start(async () => {
      const res = await removeArticle({ id });
      if (!res.ok) setError(res.error);
      else {
        router.replace("/admin/dnevnik");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Input
        label={t("articleTitle")}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <label className="block">
        <span className="mb-1 block font-ui text-xs text-[var(--text-secondary)]">{t("excerpt")}</span>
        <textarea
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className={FIELD_CLASS}
        />
      </label>
      <label className="block">
        <span className="mb-1 block font-ui text-xs text-[var(--text-secondary)]">{t("body")}</span>
        <textarea
          rows={14}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className={FIELD_CLASS}
        />
        <span className="mt-1 block font-ui text-xs text-[var(--text-muted)]">{t("bodyHint")}</span>
      </label>
      <Checkbox
        label={t("publish")}
        checked={form.published}
        onChange={(e) => setForm({ ...form, published: e.target.checked })}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {c("save")}
        </Button>
        {id && (
          <Button variant="danger" disabled={pending} onClick={remove}>
            {c("delete")}
          </Button>
        )}
        {saved && !error && <Caption>{c("saved")}</Caption>}
        {error && <Caption tone="error">{error}</Caption>}
      </div>
    </form>
  );
}
