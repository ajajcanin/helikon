"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { Checkbox, FIELD_CLASS, Input } from "@/components/atoms/Field";
import { Icon } from "@/components/atoms/Icon";
import { MediaImage } from "@/components/atoms/MediaImage";
import { uploadImage } from "@/lib/upload-image";
import { addArticle, editArticle, finishArticleImage, removeArticle, requestArticleImage } from "../actions";
import type { FeaturedRow } from "../featured";
import { findFeaturedCandidates } from "../featured-actions";
import { ArticleEditor } from "./ArticleEditor";

type Cover = { storageKey: string; width: number; height: number; alt: string };
type Props = {
  id?: number;
  title?: string;
  excerpt?: string;
  content?: unknown;
  tags?: string[];
  knownTags: string[];
  publishedAt?: string | null;
  cover?: Cover | null;
  endProducts?: { id: number; name: string }[];
};

/** A date as the browser's date-and-time field wants it: local time, to the minute. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function EndProducts({
  value,
  onChange,
}: {
  value: { id: number; name: string }[];
  onChange: (v: { id: number; name: string }[]) => void;
}) {
  const t = useTranslations("content");
  const e = useTranslations("editor");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeaturedRow[]>([]);
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      findFeaturedCandidates({ q: query }).then((res) => {
        if (current && res.ok) setResults(res.data);
      });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query]);
  const options = results.filter((r) => !value.some((v) => v.id === r.id));
  return (
    <div>
      <h3 className="mb-1 font-display text-base tracking-[0.04em]">{t("endProducts")}</h3>
      <p className="mb-2 font-ui text-xs text-[var(--text-muted)]">
        {t("endProductsHint")} {t("productsAdvice")}
      </p>
      <div className="relative max-w-lg">
        <input
          type="search"
          aria-label={e("productSearch")}
          placeholder={e("productSearch")}
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          className={FIELD_CLASS}
        />
        {options.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 max-h-60 overflow-y-auto border border-[var(--border-strong)] bg-[var(--bg-page)]">
            {options.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...value, { id: row.id, name: row.name }]);
                    setQuery("");
                  }}
                  className="block w-full px-2 py-1.5 text-left font-ui text-sm hover:bg-[var(--accent-subtle)]"
                >
                  {row.name}{" "}
                  <span className="text-xs text-[var(--text-muted)]">
                    {row.category} · {row.skus}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {value.length > 0 && (
        <ul className="mt-2 border-t border-[var(--border-subtle)]">
          {value.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between border-b border-[var(--border-subtle)] py-1.5 font-ui text-sm"
            >
              {item.name}
              <Button
                variant="icon"
                aria-label={`${t("coverRemove")}: ${item.name}`}
                onClick={() => onChange(value.filter((v) => v.id !== item.id))}
              >
                <Icon name="trash" size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ArticleForm({
  id,
  title = "",
  excerpt = "",
  content = null,
  tags = [],
  knownTags,
  publishedAt = null,
  cover = null,
  endProducts = [],
}: Props) {
  const t = useTranslations("content");
  const c = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    title,
    excerpt,
    tags: tags.join(", "),
    published: publishedAt !== null,
    date: toLocalInput(publishedAt),
  });
  const [doc, setDoc] = useState<unknown>(content);
  const [image, setImage] = useState<Cover | null>(cover);
  const [products, setProducts] = useState(endProducts);
  const coverInput = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();

  function uploadCover(file: File | undefined) {
    if (!file) return;
    setError(null);
    startUpload(async () => {
      const res = await uploadImage(file, {
        request: requestArticleImage,
        finish: (key) => finishArticleImage({ key }),
      });
      if ("error" in res) setError(res.error);
      else setImage({ ...res.data, alt: image?.alt ?? "" });
      if (coverInput.current) coverInput.current.value = "";
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const when = form.published
      ? form.date
        ? new Date(form.date).toISOString()
        : new Date().toISOString()
      : null;
    const input = {
      title: form.title,
      excerpt: form.excerpt,
      content: doc,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      publishedAt: when,
      cover: image,
      productIds: products.map((p) => p.id),
    };
    start(async () => {
      if (id) {
        const res = await editArticle({ id, ...input });
        if (!res.ok) setError(res.error);
        else {
          setSaved(true);
          if (when && !form.date) setForm({ ...form, date: toLocalInput(when) });
          router.refresh();
        }
        return;
      }
      const res = await addArticle(input);
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
    <form onSubmit={submit} className="grid gap-4">
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
      <div>
        <Input
          label={t("tags")}
          list="article-tags"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />
        <datalist id="article-tags">
          {knownTags.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
        <p className="mt-1 font-ui text-xs text-[var(--text-muted)]">{t("tagsHint")}</p>
      </div>
      <div>
        <p className="mb-1 font-ui text-xs text-[var(--text-secondary)]">{t("cover")}</p>
        {image && (
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <MediaImage
              storageKey={image.storageKey}
              width={image.width}
              height={image.height}
              alt=""
              sizes="160px"
              className="h-24 w-40 object-cover"
            />
            <Input
              className="min-w-[220px] flex-1"
              label={t("coverAlt")}
              value={image.alt}
              onChange={(e) => setImage({ ...image, alt: e.target.value })}
            />
            <Button onClick={() => setImage(null)}>{t("coverRemove")}</Button>
          </div>
        )}
        <input
          ref={coverInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          aria-label={t("coverAdd")}
          onChange={(e) => uploadCover(e.target.files?.[0])}
        />
        <Button disabled={uploading} onClick={() => coverInput.current?.click()}>
          {uploading ? t("uploading") : image ? t("coverChange") : t("coverAdd")}
        </Button>
      </div>
      <div>
        <p className="mb-1 font-ui text-xs text-[var(--text-secondary)]">{t("content")}</p>
        <ArticleEditor initial={content} onChange={setDoc} />
        <p className="mt-1 font-ui text-xs text-[var(--text-muted)]">{t("productsAdvice")}</p>
      </div>
      <EndProducts value={products} onChange={setProducts} />
      <div className="grid items-end gap-3 md:grid-cols-[auto_260px]">
        <Checkbox
          label={t("publish")}
          checked={form.published}
          onChange={(e) => setForm({ ...form, published: e.target.checked })}
        />
        {form.published && (
          <Input
            label={t("publishAt")}
            type="datetime-local"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        )}
      </div>
      {form.published && <p className="font-ui text-xs text-[var(--text-muted)]">{t("publishHint")}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending || uploading}>
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
