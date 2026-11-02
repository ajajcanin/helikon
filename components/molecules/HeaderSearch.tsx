"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useState } from "react";
import { MediaImage } from "@/components/atoms/MediaImage";
import { PaintSwatch } from "@/components/atoms/PaintSwatch";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { swatchColour } from "@/lib/colour-swatch";
import { km } from "@/lib/money";
import type { SearchSuggestions } from "@/server/public/catalog";

const MIN_LENGTH = 2;
const TYPING_PAUSE_MS = 250;
const LIST_ID = "header-search-list";

/** Search with suggestions. Pressing Enter goes to the full results, and works as a plain form before the page loads. */
export function HeaderSearch() {
  const t = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<SearchSuggestions | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const q = query.trim();

  useEffect(() => {
    setFound(null);
    setActive(-1);
    if (q.length < MIN_LENGTH) return;
    const request = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: request.signal });
        // Without suggestions, Enter still leads to the full results.
        if (res.ok) setFound(await res.json());
      } catch {}
    }, TYPING_PAUSE_MS);
    return () => {
      clearTimeout(timer);
      request.abort();
    };
  }, [q]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: closes when the page changes
  useEffect(() => setOpen(false), [pathname]);

  const rows = found?.rows ?? [];
  const results = { pathname: "/pretraga", query: { q } };
  const optionCount = rows.length > 0 ? rows.length + 1 : 0;
  const optionId = (index: number) => `${LIST_ID}-${index}`;
  const showList = open && found !== null;

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      // Search fields clear themselves on Escape. Here it only closes the list.
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && optionCount > 0) {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      // -1 is the text box itself, so the arrows can return to it.
      setActive(((active + 1 + step + optionCount + 1) % (optionCount + 1)) - 1);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setOpen(false);
    const row = showList ? rows[active] : undefined;
    if (row) router.push(`/proizvod/${row.slug}`);
    else router.push(q ? results : "/pretraga");
  }

  return (
    <form
      action="/pretraga"
      onSubmit={submit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      className="relative ml-auto hidden max-w-xs flex-1 md:block"
    >
      <input
        name="q"
        type="search"
        role="combobox"
        autoComplete="off"
        aria-label={t("search")}
        aria-expanded={showList}
        aria-controls={LIST_ID}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        placeholder={t("searchHint")}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={keyDown}
        className="h-10 w-full rounded-[2px] border border-[var(--border-subtle)] bg-transparent px-3 font-ui text-sm text-[var(--text-display)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: only stops the mouse taking focus. The text box handles the keyboard. */}
      <div
        hidden={!showList}
        // Keeps focus in the text box while clicking, so the list doesn't close before the click lands.
        onMouseDown={(event) => event.preventDefault()}
        className="absolute top-full right-0 z-50 mt-1 w-[440px] max-w-[calc(100vw-48px)] border border-[var(--border-strong)] bg-[var(--bg-well)] shadow-lg"
      >
        <div id={LIST_ID} role="listbox" aria-label={t("search")}>
          {rows.map((row, index) => (
            <div
              key={row.slug}
              id={optionId(index)}
              role="option"
              tabIndex={-1}
              aria-selected={active === index}
            >
              <Link
                href={`/proizvod/${row.slug}`}
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 ${active === index ? "bg-[var(--accent-subtle)]" : "hover:bg-[var(--accent-subtle)]"}`}
              >
                {row.photo ? (
                  <MediaImage
                    storageKey={row.photo.storageKey}
                    width={row.photo.width}
                    height={row.photo.height}
                    alt=""
                    sizes="48px"
                    className="h-12 w-12 flex-none object-cover"
                  />
                ) : (
                  <PaintSwatch color={swatchColour(row.colourFamily)} className="h-12 w-12 flex-none" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base text-[var(--text-display)]">
                    {row.name}
                  </span>
                  <span className="block truncate font-ui text-xs text-[var(--text-muted)]">
                    {[row.category, row.code].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex-none text-right font-ui text-sm text-[var(--text-display)]">
                  {row.severalPrices ? t("from", { price: km(row.price) }) : km(row.price)}
                  {!row.inStock && (
                    <span className="block text-[11px] text-[var(--text-muted)]">{t("outOfStock")}</span>
                  )}
                </span>
              </Link>
            </div>
          ))}
          {rows.length > 0 && (
            <div
              id={optionId(rows.length)}
              role="option"
              tabIndex={-1}
              aria-selected={active === rows.length}
            >
              <Link
                href={results}
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className={`block border-t border-[var(--border-subtle)] px-3 py-2.5 text-center font-ui text-xs tracking-[0.08em] text-[var(--accent-bright)] ${active === rows.length ? "bg-[var(--accent-subtle)]" : "hover:bg-[var(--accent-subtle)]"}`}
              >
                {t("allResults", { count: found?.total ?? 0 })}
              </Link>
            </div>
          )}
        </div>
        {found && rows.length === 0 && (
          <p role="status" className="px-3 py-3 font-ui text-sm text-[var(--text-secondary)]">
            {t("searchEmpty", { q })}
          </p>
        )}
      </div>
    </form>
  );
}
