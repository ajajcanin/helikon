"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState, useTransition } from "react";
import { Caption } from "@/components/atoms/Caption";
import { SubmitButton } from "@/components/atoms/SubmitButton";
import { confirmReview, saveReviewField, saveVariantField } from "../actions";
import { COLOUR_FAMILIES } from "../classify";
import type { ReviewField, ReviewRow } from "../review";

type Options = {
  categories: { id: number; label: string; isTop: boolean; selectable: boolean }[];
  manufacturers: { id: number; name: string; lines: { id: number; name: string }[] }[];
};

const FIELD =
  "w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-well)] px-2.5 py-2 font-ui text-sm text-[var(--text-display)] outline-none focus:border-[var(--accent)]";
const LABEL = "mb-1 block font-ui text-xs text-[var(--text-secondary)]";

type Result = { ok: true; data: { changed: boolean; confirmed: boolean } } | { ok: false; error: string };

/** Text field that saves when you leave it, and only if the text changed. */
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
  const props = {
    id,
    value: text,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(e.target.value),
    onBlur: () => {
      if (text !== value) save(text);
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

export function ReviewCard({ row, options }: { row: ReviewRow; options: Options }) {
  const t = useTranslations("review");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmed, setConfirmed] = useState(row.confirmed);
  const [manufacturerId, setManufacturerId] = useState(String(row.manufacturerId ?? ""));
  const [lineId, setLineId] = useState(String(row.lineId ?? ""));
  const lines = options.manufacturers.find((m) => String(m.id) === manufacturerId)?.lines ?? [];
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        setMessage({ tone: "error", text: res.error || t("error") });
        return;
      }
      if (res.data.changed) {
        setConfirmed(true);
        setMessage({ tone: "ok", text: t("saved") });
      }
    });
  const save = (field: ReviewField) => (value: string) =>
    run(() => saveReviewField({ id: row.id, field, value }));
  const f = (name: ReviewField) => t(`fields.${name}`);

  function confirm() {
    start(async () => {
      const res = await confirmReview({ ids: [row.id] });
      if (!res.ok) {
        setMessage({ tone: "error", text: res.error || t("error") });
        return;
      }
      setConfirmed(true);
      setMessage(null);
      router.refresh();
    });
  }

  return (
    <li
      className={`border p-4 ${confirmed ? "border-[var(--accent)]" : "border-[var(--border-subtle)]"}`}
      data-product={row.id}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base tracking-[0.04em]">{row.name}</h2>
        <div className="flex items-center gap-3 font-ui text-xs">
          <span
            className={confirmed ? "text-[var(--accent-bright)]" : "text-[var(--text-muted)]"}
            role="status"
          >
            {confirmed ? t("confirmed") : t("open")}
          </span>
          {!confirmed && (
            <button
              type="button"
              onClick={confirm}
              disabled={pending}
              className="rounded-[2px] bg-[var(--accent)] px-3 py-1.5 font-semibold text-[var(--text-on-accent)] disabled:opacity-45"
            >
              {t("confirm")}
            </button>
          )}
        </div>
      </div>

      {row.reviewNote && (
        <p className="mb-3 font-ui text-xs text-[var(--text-muted)]">
          {t("note")}: {row.reviewNote}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-3">
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
              save={(value) => run(() => saveVariantField({ id: v.id, field: "size", value }))}
            />
            <TextEdit
              label={t("fields.price")}
              value={v.price}
              save={(value) => run(() => saveVariantField({ id: v.id, field: "price", value }))}
            />
            <div>
              <span className={LABEL}>{t("fields.stock")}</span>
              <span className="font-ui text-sm">{v.stockQty}</span>
            </div>
          </div>
        ))}
      </div>

      <div aria-live="polite" className="mt-2">
        {message && <Caption tone={message.tone === "error" ? "error" : undefined}>{message.text}</Caption>}
      </div>
    </li>
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
