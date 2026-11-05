"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { ProductImage } from "@/components/atoms/ProductImage";
import { SubmitButton } from "@/components/atoms/SubmitButton";
import { mediaUrl } from "@/lib/media";
import { uploadImage } from "@/lib/upload-image";
import {
  confirmReview,
  finishProductPhoto,
  removePhoto,
  replaceProductPhoto,
  requestProductPhoto,
  saveReviewField,
  saveVariantField,
  unconfirmReview,
} from "../actions";
import { COLOUR_FAMILIES } from "../classify";
import type { ReviewField, ReviewRow } from "../review";

type Options = {
  categories: { id: number; label: string; isTop: boolean; selectable: boolean }[];
  manufacturers: { id: number; name: string; lines: { id: number; name: string }[] }[];
};

const FIELD =
  "w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-well)] px-2.5 py-2 font-ui text-sm text-[var(--text-display)] outline-none focus:border-[var(--accent)]";
const LABEL = "mb-1 block font-ui text-xs text-[var(--text-secondary)]";

type Result = { ok: true; data: { changed: boolean } } | { ok: false; error: string };

/** Text field that saves when you leave it, and only if the text changed since it last tried. */
function TextEdit({
  label,
  value,
  rows,
  save,
}: {
  label: string;
  value: string;
  rows?: number;
  save: (v: string) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const [sent, setSent] = useState(value);
  const props = {
    id,
    value: text,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(e.target.value),
    onBlur: () => {
      if (text === sent) return;
      setSent(text);
      save(text);
    },
    className: FIELD,
  };
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {rows ? <textarea rows={rows} {...props} /> : <input {...props} />}
    </div>
  );
}

function SelectEdit({
  label,
  value,
  options,
  save,
  empty,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  save: (v: string) => void;
  empty?: string;
}) {
  // Kept here because saving doesn't reload the page: a confirmed card stays open for more edits.
  const [selected, setSelected] = useState(value);
  useEffect(() => setSelected(value), [value]);
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <select
        className={FIELD}
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          save(e.target.value);
        }}
      >
        {empty !== undefined && <option value="">{empty}</option>}
        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

/** One place for a photo: replaces or removes the one it holds, or adds one, for the size when it has one. */
function PhotoSlot({
  productId,
  variantId,
  label,
  photo,
  wide,
}: {
  productId: number;
  variantId?: number;
  label?: string;
  photo?: ReviewRow["photos"][number];
  wide?: boolean;
}) {
  const t = useTranslations("review");
  const c = useTranslations("common");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    start(async () => {
      const res = await uploadImage(file, {
        request: requestProductPhoto,
        finish: (key) =>
          photo
            ? replaceProductPhoto({ id: photo.id, productId, key })
            : finishProductPhoto({ productId, key, variantId }),
      });
      if (input.current) input.current.value = "";
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  function remove() {
    if (!photo || !window.confirm(c("confirmDelete"))) return;
    setError(null);
    start(async () => {
      const res = await removePhoto({ id: photo.id });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  const action =
    "font-ui text-xs text-[var(--accent-bright)] underline-offset-2 hover:underline disabled:opacity-45";
  return (
    <div className={`flex w-full flex-col gap-2 ${wide ? "" : "md:w-56 md:shrink-0"}`}>
      {label && <span className="font-ui text-xs text-[var(--text-secondary)]">{label}</span>}
      <div className="flex h-56 items-center justify-center border border-[var(--border-subtle)] bg-[var(--product-tile)]">
        {photo ? (
          <a
            href={mediaUrl(photo.storageKey, photo.width, photo.width)}
            target="_blank"
            rel="noreferrer"
            aria-label={t("photoOpen")}
            title={t("photoOpen")}
            className="block h-full w-full"
          >
            <ProductImage
              key={photo.storageKey}
              storageKey={photo.storageKey}
              width={photo.width}
              height={photo.height}
              alt=""
              sizes="224px"
              className="h-full w-full"
            />
          </a>
        ) : (
          <span className="font-ui text-xs text-neutral-600">{t("photoNone")}</span>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        aria-label={`${photo ? t("photoReplace") : t("photoAdd")}${label ? `: ${label}` : ""}`}
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <button type="button" disabled={pending} onClick={() => input.current?.click()} className={action}>
          {pending ? t("photoUploading") : photo ? t("photoReplace") : t("photoAdd")}
        </button>
        {photo && (
          <button type="button" disabled={pending} onClick={remove} className={action}>
            {t("photoRemove")}
          </button>
        )}
      </div>
      <div aria-live="polite">{error && <Caption tone="error">{error}</Caption>}</div>
    </div>
  );
}

/** One photo per product, or one per size when it comes in several. */
export function ReviewPhoto({ row }: { row: ReviewRow }) {
  const sizes = row.variants.filter((v) => v.size);
  if (sizes.length < 2) return <PhotoSlot productId={row.id} photo={row.photos[0]} />;
  return (
    <div className="w-full md:w-[460px] md:shrink-0">
      <div className="grid grid-cols-2 gap-3">
        {sizes.map((v, index) => (
          <PhotoSlot
            key={v.id}
            productId={row.id}
            variantId={v.id}
            label={v.size ?? undefined}
            photo={
              row.photos.find((p) => p.variantId === v.id) ??
              (index === 0 ? row.photos.find((p) => !sizes.some((s) => s.id === p.variantId)) : undefined)
            }
            wide
          />
        ))}
      </div>
    </div>
  );
}

export function ReviewCard({
  row,
  options,
  editOnly,
  onCancel,
}: {
  row: ReviewRow;
  options: Options;
  /** On the product's own page: only the fields, kept until Save, without confirming, its note and its photos. */
  editOnly?: boolean;
  onCancel?: () => void;
}) {
  const t = useTranslations("review");
  const c = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmed, setConfirmed] = useState(row.confirmed);
  const [manufacturerId, setManufacturerId] = useState(String(row.manufacturerId ?? ""));
  const [lineId, setLineId] = useState(String(row.lineId ?? ""));
  const lines = options.manufacturers.find((m) => String(m.id) === manufacturerId)?.lines ?? [];
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // Clicking Potvrdi leaves the field being typed in, so its save is still running when confirm starts.
  const saving = useRef<Promise<unknown>>(Promise.resolve());
  const failed = useRef(new Set<string>());
  // On the product's own page, changes wait here until Save. Each stays until it has been saved.
  const drafts = useRef(new Map<string, () => Promise<Result>>());
  const [dirty, setDirty] = useState(false);
  const [leaving, setLeaving] = useState<{ go: () => void } | null>(null);

  // Asks before leaving with unsaved changes. Closing or reloading the tab can only get the browser's own question.
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const click = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.origin !== window.location.origin) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaving({ go: () => router.push(link.pathname + link.search) });
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, router]);

  function saveDrafts() {
    start(async () => {
      let changed = false;
      let error: string | null = null;
      for (const [key, send] of drafts.current) {
        const res = await send().catch((): Result => ({ ok: false, error: "" }));
        if (res.ok) {
          drafts.current.delete(key);
          changed ||= res.data.changed;
        } else {
          error = res.error || t("error");
        }
      }
      setMessage(error ? { tone: "error", text: error } : changed ? { tone: "ok", text: t("saved") } : null);
      if (!error) setDirty(false);
      if (changed) router.refresh();
    });
  }

  const run = (key: string, fn: () => Promise<Result>) => {
    if (editOnly) {
      drafts.current.set(key, fn);
      return;
    }
    const save = fn()
      .catch((): Result => ({ ok: false, error: "" }))
      .then((res) => {
        if (!res.ok) {
          failed.current.add(key);
          setMessage({ tone: "error", text: res.error || t("error") });
          return;
        }
        failed.current.delete(key);
        setMessage(res.data.changed ? { tone: "ok", text: t("saved") } : null);
      });
    saving.current = Promise.all([saving.current, save]);
  };
  const save = (field: ReviewField) => (value: string) =>
    run(field, () => saveReviewField({ id: row.id, field, value }));
  const f = (name: ReviewField) => t(`fields.${name}`);

  function setStatus(next: boolean) {
    start(async () => {
      await saving.current;
      // A value that was refused is still on screen, so the product isn't what it appears to be.
      if (next && failed.current.size > 0) {
        setMessage((shown) => (shown?.tone === "error" ? shown : { tone: "error", text: t("error") }));
        return;
      }
      const res = await (next ? confirmReview({ ids: [row.id] }) : unconfirmReview({ id: row.id }));
      if (!res.ok) {
        setMessage({ tone: "error", text: res.error || t("error") });
        return;
      }
      setConfirmed(next);
      setMessage(null);
      router.refresh();
    });
  }

  return (
    <li
      className={`border p-4 ${confirmed ? "border-[var(--accent)]" : "border-[var(--border-subtle)]"}`}
      data-product={row.id}
      onInput={editOnly ? () => setDirty(true) : undefined}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base tracking-[0.04em]">{row.name}</h2>
        {!editOnly && (
          <div className="flex items-center gap-3 font-ui text-xs">
            <span
              className={confirmed ? "text-[var(--accent-bright)]" : "text-[var(--text-muted)]"}
              role="status"
            >
              {confirmed ? t("confirmed") : t("open")}
            </span>
            {confirmed ? (
              <button
                type="button"
                onClick={() => setStatus(false)}
                disabled={pending}
                className="rounded-[2px] border border-[var(--border-strong)] px-3 py-1.5 text-[var(--text-secondary)] disabled:opacity-45"
              >
                {t("unconfirm")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStatus(true)}
                disabled={pending}
                className="rounded-[2px] bg-[var(--accent)] px-3 py-1.5 font-semibold text-[var(--text-on-accent)] disabled:opacity-45"
              >
                {t("confirm")}
              </button>
            )}
          </div>
        )}
      </div>

      {!editOnly && row.reviewNote && (
        <p className="mb-3 font-ui text-xs text-[var(--text-muted)]">
          {t("note")}: {row.reviewNote}
        </p>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {!editOnly && <ReviewPhoto row={row} />}
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <TextEdit label={f("name")} value={row.name} save={save("name")} />
          <SelectEdit
            label={f("categoryId")}
            value={String(row.categoryId ?? "")}
            options={options.categories
              .filter((c) => c.selectable)
              .map((c) => [String(c.id), c.label] as const)}
            save={save("categoryId")}
            empty={t("none")}
          />
          <SelectEdit
            label={f("manufacturerId")}
            value={manufacturerId}
            options={options.manufacturers.map((m) => [String(m.id), m.name] as const)}
            save={(value) => {
              setManufacturerId(value);
              setLineId("");
              drafts.current.delete("lineId");
              save("manufacturerId")(value);
            }}
            empty={t("none")}
          />
          <SelectEdit
            label={f("lineId")}
            value={lineId}
            options={lines.map((l) => [String(l.id), l.name] as const)}
            save={(value) => {
              setLineId(value);
              save("lineId")(value);
            }}
            empty={t("none")}
          />
          <TextEdit label={f("colourName")} value={row.colourName ?? ""} save={save("colourName")} />
          <TextEdit
            label={f("colourNameMaker")}
            value={row.colourNameMaker ?? ""}
            save={save("colourNameMaker")}
          />
          <TextEdit label={f("colourCode")} value={row.colourCode ?? ""} save={save("colourCode")} />
          <SelectEdit
            label={f("colourFamily")}
            value={row.colourFamily ?? ""}
            options={COLOUR_FAMILIES}
            save={save("colourFamily")}
            empty={t("none")}
          />
          <SelectEdit
            label={f("medium")}
            value={row.medium ?? ""}
            options={[
              ["akril", t("mediumAkril")],
              ["ulje", t("mediumUlje")],
            ]}
            save={save("medium")}
            empty={t("none")}
          />
          <TextEdit label={f("finish")} value={row.finish ?? ""} save={save("finish")} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <TextEdit
          label={f("description")}
          value={row.description ?? ""}
          rows={4}
          save={save("description")}
        />
        <TextEdit label={f("specs")} value={row.specs} rows={4} save={save("specs")} />
      </div>

      <div className="mt-3 grid gap-2">
        {row.variants.map((v) => (
          <div key={v.id} className="grid grid-cols-2 items-end gap-3 md:grid-cols-4">
            <div>
              <span className={LABEL}>{t("fields.sku")}</span>
              <span className="font-ui text-sm">{v.sku}</span>
            </div>
            <TextEdit
              label={t("fields.size")}
              value={v.size ?? ""}
              save={(value) =>
                run(`size-${v.id}`, () => saveVariantField({ id: v.id, field: "size", value }))
              }
            />
            <TextEdit
              label={t("fields.price")}
              value={v.price}
              save={(value) =>
                run(`price-${v.id}`, () => saveVariantField({ id: v.id, field: "price", value }))
              }
            />
            <div>
              <span className={LABEL}>{t("fields.stock")}</span>
              <span className="font-ui text-sm">{v.stockQty}</span>
            </div>
          </div>
        ))}
      </div>

      {editOnly && (
        <div className="mt-4 flex gap-3">
          <Button variant="primary" disabled={pending} onClick={saveDrafts}>
            {c("save")}
          </Button>
          <Button
            disabled={pending}
            onClick={() => (dirty ? setLeaving({ go: () => onCancel?.() }) : onCancel?.())}
          >
            {c("cancel")}
          </Button>
        </div>
      )}
      {leaving && (
        <LeaveDialog
          onStay={() => setLeaving(null)}
          onLeave={() => {
            setDirty(false);
            setLeaving(null);
            leaving.go();
          }}
        />
      )}

      <div aria-live="polite" className="mt-2">
        {message && <Caption tone={message.tone === "error" ? "error" : undefined}>{message.text}</Caption>}
      </div>
    </li>
  );
}

function LeaveDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const t = useTranslations("review");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => dialog.current?.showModal(), []);
  return (
    <dialog
      ref={dialog}
      onCancel={onStay}
      className="m-auto max-w-sm border border-[var(--border-strong)] bg-[var(--bg-well)] p-5 text-[var(--text-display)] backdrop:bg-black/60"
    >
      <h2 className="font-display text-base tracking-[0.04em]">{t("leaveTitle")}</h2>
      <p className="mt-2 font-ui text-sm text-[var(--text-secondary)]">{t("leaveText")}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="primary" onClick={onStay}>
          {t("leaveStay")}
        </Button>
        <Button onClick={onLeave}>{t("leaveDiscard")}</Button>
      </div>
    </dialog>
  );
}

/** A product's fields on its own page. Cancel starts them again from what is saved. */
export function ProductEditCard({ row, options }: { row: ReviewRow; options: Options }) {
  const [version, setVersion] = useState(0);
  return (
    <ReviewCard key={version} row={row} options={options} editOnly onCancel={() => setVersion(version + 1)} />
  );
}

export function ProductReview({ rows, options }: { rows: ReviewRow[]; options: Options }) {
  const t = useTranslations("review");
  const router = useRouter();
  const [pending, start] = useTransition();
  const open = rows.filter((r) => !r.confirmed).map((r) => r.id);

  if (rows.length === 0) return <p className="font-ui text-sm text-[var(--text-muted)]">{t("empty")}</p>;

  return (
    <>
      {open.length > 0 && (
        <form
          className="mb-4"
          onSubmit={(event) => {
            event.preventDefault();
            start(async () => {
              await confirmReview({ ids: open });
              router.refresh();
            });
          }}
        >
          <SubmitButton loading={pending}>{t("confirmPage", { count: open.length })}</SubmitButton>
        </form>
      )}
      <ul className="flex flex-col gap-4">
        {rows.map((row) => (
          // Keyed by the values too, so a refresh shows what the server now holds.
          <ReviewCard key={`${row.id}-${row.confirmed}`} row={row} options={options} />
        ))}
      </ul>
    </>
  );
}
