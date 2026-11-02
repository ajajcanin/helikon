import type { Tx } from "@/server/db";

const YEAR = new Intl.DateTimeFormat("en", { timeZone: "Europe/Sarajevo", year: "numeric" });

/** Next number in a series, e.g. 2026-000123. Part of the caller's transaction, so a failed order leaves no gap. */
export async function nextNumber(tx: Tx, series: string, at = new Date()): Promise<string> {
  const year = Number(YEAR.format(at));
  const row = await tx.numberCounter.upsert({
    where: { series_year: { series, year } },
    create: { series, year, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${year}-${String(row.value).padStart(6, "0")}`;
}
