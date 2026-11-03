import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { displayName, swatchColour } from "@/lib/colour-swatch";
import type { listLineColours } from "@/server/public/catalog";
import { COLOUR_FAMILIES } from "../../classify";

type Colour = Awaited<ReturnType<typeof listLineColours>>[number];

/** Above this, a line is shown by colour family, with only the current family open. */
const FLAT_LIMIT = 24;

function FamilyDot({ family }: { family: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3 w-3 flex-none rounded-full border border-[var(--border-strong)]"
      style={{ background: swatchColour(family) ?? undefined }}
    />
  );
}

async function ColourLinks({ colours, currentId }: { colours: Colour[]; currentId: number }) {
  const t = await getTranslations("shop");
  return (
    <ul className="flex flex-wrap gap-1.5">
      {colours.map((colour) => {
        const inStock = colour.variants.some((v) => v.stockQty > 0);
        const current = colour.id === currentId;
        return (
          <li key={colour.id}>
            <Link
              href={`/proizvod/${colour.slug}`}
              aria-current={current ? "page" : undefined}
              className={`inline-flex items-center rounded-[2px] border px-2.5 py-1.5 font-ui text-xs transition-colors ${
                current
                  ? "border-[var(--accent)] text-[var(--accent-bright)]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-brass)]"
              } ${inStock ? "" : "opacity-50"}`}
            >
              {displayName(colour)}
              {!inStock && <span className="sr-only">({t("outOfStock")})</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Moves between a line's colours. Each colour keeps its own page, stock and address. */
export async function LineColours({
  line,
  colours,
  currentId,
}: {
  line: string;
  colours: Colour[];
  currentId: number;
}) {
  const t = await getTranslations("shop");
  const currentFamily = colours.find((c) => c.id === currentId)?.colourFamily ?? null;
  const known: [string | null, string][] = COLOUR_FAMILIES.filter(([id]) =>
    colours.some((c) => c.colourFamily === id),
  ).map(([id, label]) => [id, label]);
  const labelled = new Set(known.map(([id]) => id));
  const hasOther = colours.some((c) => !labelled.has(c.colourFamily));
  const inOther = (c: Colour) => !labelled.has(c.colourFamily);
  const families: [string | null, string][] = [
    ...known,
    ...(hasOther ? [[null, t("otherColours")] as [null, string]] : []),
  ];
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-ui text-[11px] tracking-[0.16em] text-[var(--text-muted)] uppercase">
        {t("lineColours", { line, count: colours.length })}
      </h2>
      {colours.length <= FLAT_LIMIT ? (
        <ColourLinks colours={colours} currentId={currentId} />
      ) : (
        <div className="border-t border-[var(--border-subtle)]">
          {families.map(([id, label]) => {
            const group = colours.filter((c) => (id === null ? inOther(c) : c.colourFamily === id));
            return (
              <details
                key={label}
                open={id === currentFamily || (id === null && !labelled.has(currentFamily))}
                className="border-b border-[var(--border-subtle)] py-2.5"
              >
                <summary className="cursor-pointer font-ui text-sm text-[var(--text-secondary)]">
                  {id && <FamilyDot family={id} />} {label}{" "}
                  <span className="text-xs text-[var(--text-muted)]">({group.length})</span>
                </summary>
                <div className="mt-2.5">
                  <ColourLinks colours={group} currentId={currentId} />
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
