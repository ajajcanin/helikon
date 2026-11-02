"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { FIELD_CLASS } from "@/components/atoms/Field";
import { Icon } from "@/components/atoms/Icon";
import { PaintSwatch, SmearFilter } from "@/components/atoms/PaintSwatch";
import { swatchColour } from "@/lib/colour-swatch";
import { km } from "@/lib/money";
import type { FeaturedRow } from "../featured";
import { fillFeatured, findFeaturedCandidates, saveFeaturedOrder } from "../featured-actions";

const MAX = 8;

function Thumb({ row }: { row: FeaturedRow }) {
  if (row.imageUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: already resized at upload and served from object storage
      <img
        src={row.imageUrl}
        alt=""
        className="h-12 w-12 flex-none border border-[var(--border-subtle)] object-cover"
      />
    );
  }
  return (
    <PaintSwatch
      color={swatchColour(row.colourFamily)}
      className="h-12 w-12 flex-none border border-[var(--border-subtle)]"
    />
  );
}

function Details({ row }: { row: FeaturedRow }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate font-ui text-sm text-[var(--text-display)]">{row.name}</p>
      <p className="truncate font-ui text-xs text-[var(--text-muted)]">
        {row.category} · {row.skus}
      </p>
    </div>
  );
}

export function FeaturedPicker({ initial, canUseProfit }: { initial: FeaturedRow[]; canUseProfit: boolean }) {
  const t = useTranslations("featured");
  const c = useTranslations("common");
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeaturedRow[]>([]);
  const [count, setCount] = useState(MAX);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

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

  /** Every change is saved straight away, as in the other admin lists. */
  function save(next: FeaturedRow[]) {
    const previous = rows;
    setRows(next);
    setMessage(null);
    start(async () => {
      const res = await saveFeaturedOrder({ ids: next.map((r) => r.id) });
      if (!res.ok) {
        setRows(previous);
        setMessage({ tone: "error", text: res.error });
      } else {
        setMessage({ tone: "ok", text: c("saved") });
      }
    });
  }

  function move(index: number, by: -1 | 1) {
    const next = [...rows];
    const other = next[index + by];
    const row = next[index];
    if (!other || !row) return;
    next[index] = other;
    next[index + by] = row;
    save(next);
  }

  function fill(by: "sold" | "profit") {
    if (rows.length > 0 && !window.confirm(t("confirmReplace"))) return;
    setMessage(null);
    start(async () => {
      const res = await fillFeatured({ by, count });
      if (!res.ok) {
        setMessage({ tone: "error", text: res.error });
      } else if (res.data.length === 0) {
        setMessage({ tone: "error", text: t("noSales") });
      } else {
        setRows(res.data);
        setMessage({ tone: "ok", text: c("saved") });
      }
    });
  }

  const full = rows.length >= MAX;
  const candidates = results.filter((r) => !rows.some((row) => row.id === r.id));
  return (
    <section>
      <SmearFilter />
      <h3 className="mt-6 mb-1 font-display text-base tracking-[0.04em]">{t("title")}</h3>
      <p className="mb-3 font-ui text-xs text-[var(--text-muted)]">{t("hint", { max: MAX })}</p>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="block w-24 font-ui text-xs text-[var(--text-secondary)]">
          {t("howMany")}
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className={`${FIELD_CLASS} mt-1`}
          >
            <option value={4}>4</option>
            <option value={8}>8</option>
          </select>
        </label>
        <Button disabled={pending} onClick={() => fill("sold")}>
          {t("bestSold")}
        </Button>
        {canUseProfit && (
          <Button disabled={pending} onClick={() => fill("profit")}>
            {t("bestProfit")}
          </Button>
        )}
      </div>

      <div className="relative mb-4 max-w-lg">
        <input
          type="search"
          aria-label={t("search")}
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={FIELD_CLASS}
        />
        {candidates.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 max-h-80 overflow-y-auto border border-[var(--border-strong)] bg-[var(--bg-page)] shadow-[var(--bloom-soft)]">
            {candidates.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={full || pending}
                  onClick={() => {
                    save([...rows, row]);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 p-2 text-left hover:bg-[var(--accent-subtle)] disabled:opacity-45"
                >
                  <Thumb row={row} />
                  <Details row={row} />
                  <span className="font-ui text-xs whitespace-nowrap text-[var(--text-secondary)]">
                    {row.priceFrom ? km(row.priceFrom) : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="border border-[var(--border-subtle)] p-4 font-ui text-sm text-[var(--text-muted)]">
          {t("empty")}
        </p>
      ) : (
        <ol className="border-t border-[var(--border-subtle)]">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 border-b border-[var(--border-subtle)] py-2"
            >
              <span className="w-5 text-right font-ui text-xs text-[var(--text-muted)]">{index + 1}</span>
              <Thumb row={row} />
              <Details row={row} />
              {row.hiddenBecause && (
                <span className="font-ui text-xs text-[var(--warning)]">
                  {t(`hidden_${row.hiddenBecause}`)}
                </span>
              )}
              <span className="w-20 text-right font-ui text-sm whitespace-nowrap">
                {row.priceFrom ? km(row.priceFrom) : ""}
              </span>
              <span className="w-16 text-right font-ui text-xs text-[var(--text-muted)]">
                {t("stock", { count: row.stock })}
              </span>
              <div className="flex items-center">
                <Button
                  variant="icon"
                  aria-label={c("moveUp")}
                  title={c("moveUp")}
                  disabled={pending || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <Icon name="up" size={16} />
                </Button>
                <Button
                  variant="icon"
                  aria-label={c("moveDown")}
                  title={c("moveDown")}
                  disabled={pending || index === rows.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <Icon name="down" size={16} />
                </Button>
                <Button
                  variant="icon"
                  aria-label={t("remove")}
                  title={t("remove")}
                  disabled={pending}
                  onClick={() => save(rows.filter((r) => r.id !== row.id))}
                >
                  <Icon name="trash" size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div aria-live="polite" className="mt-2 min-h-5">
        {message && <Caption tone={message.tone === "error" ? "error" : undefined}>{message.text}</Caption>}
      </div>
    </section>
  );
}
