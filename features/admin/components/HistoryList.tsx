import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { HistoryRow } from "../history";

/** History rows: what changed, on which product, and who did it. */
export async function HistoryList({ rows, className }: { rows: HistoryRow[]; className?: string }) {
  const t = await getTranslations("history");
  const c = await getTranslations("common");
  const format = await getFormatter();
  return (
    <ul className={`divide-y divide-[var(--border-subtle)] ${className ?? ""}`}>
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
          <div className="min-w-0">
            <p>
              {r.title}
              {r.product && (
                <>
                  {": "}
                  <Link
                    href={`/admin/artikli/${r.product.id}`}
                    className="text-[var(--accent-bright)] underline underline-offset-2"
                  >
                    {r.product.name}
                  </Link>
                </>
              )}
            </p>
            {r.product && r.product.skus.length > 0 && (
              <p className="mt-1 font-ui text-xs text-[var(--text-muted)]">
                {t("sku")}: {r.product.skus.join(", ")}
              </p>
            )}
            {r.changes.map((change) => (
              <p key={change.field} className="mt-1 font-ui text-xs text-[var(--text-secondary)]">
                {t(`f_${change.field}`)}: {change.from ?? c("noValue")} → {change.to ?? c("noValue")}
              </p>
            ))}
          </div>
          <span className="text-[var(--text-muted)]">
            {r.userName} · {format.dateTime(r.at, "long")}
          </span>
        </li>
      ))}
    </ul>
  );
}
