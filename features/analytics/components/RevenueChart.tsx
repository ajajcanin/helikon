"use client";

import { useState } from "react";
import type { DayRevenue } from "../analytics";

const HEIGHT = 160;

/** One series, one axis: no legend, the title names it. A table under the chart gives the same numbers. */
export function RevenueChart({
  series,
  title,
  formatKm,
}: {
  series: (DayRevenue & { label: string; value: string })[];
  title: string;
  formatKm: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...series.map((d) => d.revenue), 1);
  const hovered = active === null ? null : series[active];
  return (
    <figure aria-label={title} className="m-0">
      <p className="mb-2 h-5 font-ui text-sm text-[var(--text-secondary)]" aria-live="polite">
        {hovered ? `${hovered.label}: ${hovered.value}` : formatKm}
      </p>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: hover only repeats what the table below shows */}
      <div
        className="flex items-end border-b border-[var(--border-strong)]"
        style={{ height: HEIGHT }}
        onMouseLeave={() => setActive(null)}
      >
        {series.map((d, i) => (
          // The target is the full column, wider and taller than the bar.
          // biome-ignore lint/a11y/noStaticElementInteractions: hover only repeats what the table below shows
          <div
            key={d.day}
            className="flex h-full min-w-0 flex-1 items-end px-px"
            onMouseEnter={() => setActive(i)}
          >
            {d.revenue > 0 && (
              <div
                className="w-full rounded-t-[4px]"
                style={{
                  height: Math.max(2, (d.revenue / max) * (HEIGHT - 4)),
                  background: active === i ? "var(--accent-bright)" : "var(--accent)",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between font-ui text-xs text-[var(--text-muted)]">
        <span>{series[0]?.label}</span>
        <span>{series.at(-1)?.label}</span>
      </div>
    </figure>
  );
}
