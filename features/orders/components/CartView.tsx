"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PaintSwatch } from "@/components/atoms/PaintSwatch";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";
import { displayName, swatchColour } from "@/lib/colour-swatch";
import { km } from "@/lib/money";
import { readCart } from "../checkout-actions";
import { QuantityStepper } from "./QuantityStepper";

type Cart = Awaited<ReturnType<typeof readCart>>;

const PRIMARY =
  "inline-flex h-12 items-center justify-center rounded-[2px] bg-[var(--accent)] px-6 font-ui text-sm font-semibold tracking-[0.08em] text-[var(--text-on-accent)] hover:bg-[var(--accent-bright)]";

export function CartView({ firstCategoryHref }: { firstCategoryHref: string }) {
  const t = useTranslations("shop");
  const { lines, setQty } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const key = JSON.stringify(lines);

  // biome-ignore lint/correctness/useExhaustiveDependencies: key is the serialised form of lines
  useEffect(() => {
    if (lines.length === 0) return;
    let current = true;
    readCart(lines).then((data) => {
      if (current) setCart(data);
    });
    return () => {
      current = false;
    };
  }, [key]);

  if (lines.length === 0) {
    return (
      <div className="border border-[var(--border-subtle)] bg-[var(--surface-sunk)] px-6 py-16 text-center">
        <p className="font-display text-2xl tracking-[0.04em] text-[var(--text-display)]">
          {t("cartEmptyTitle")}
        </p>
        <p className="mt-1.5 mb-5 font-body text-[var(--text-secondary)]">{t("cartEmptyText")}</p>
        <Link href={firstCategoryHref} className={PRIMARY}>
          {t("heroCta")}
        </Link>
      </div>
    );
  }
  if (!cart) return <p className="font-ui text-sm text-[var(--text-muted)]">{t("loading")}</p>;

  const blocked = cart.lines.some((l) => !l.available || l.qty > l.stockQty);
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px]">
      <ul className="border-t border-[var(--border-subtle)]">
        {cart.lines.map((line) => (
          <li
            key={line.variantId}
            className="grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-[var(--border-subtle)] py-5"
          >
            <PaintSwatch
              color={swatchColour(line.colourFamily)}
              className="h-16 w-16 border border-[var(--border-subtle)]"
            />
            <div className="min-w-0">
              <Link
                href={`/proizvod/${line.slug}`}
                className="font-display text-lg tracking-[0.03em] text-[var(--text-display)]"
              >
                {displayName(line)}
              </Link>
              <p className="mt-1 font-ui text-xs tracking-[0.08em] text-[var(--text-muted)]">
                {line.name !== displayName(line) ? `${line.name.split(" - ")[0]} · ` : ""}
                {line.sku}
                {line.size ? ` · ${line.size}` : ""}
              </p>
              <div className="mt-2.5">
                {line.available ? (
                  <QuantityStepper
                    value={line.qty}
                    max={Math.max(line.stockQty, 1)}
                    onChange={(qty) => setQty(line.variantId, qty)}
                  />
                ) : (
                  <p className="font-ui text-[13px] text-[var(--warning)]">{t("lineUnavailable")}</p>
                )}
                {line.available && line.qty > line.stockQty && (
                  <p className="mt-1.5 font-ui text-[13px] text-[var(--warning)]">
                    {t("lineLimit", { count: line.stockQty })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="font-ui text-base font-semibold whitespace-nowrap">
                {km((Number(line.unitPrice) * line.qty).toFixed(2))}
              </span>
              <button
                type="button"
                onClick={() => setQty(line.variantId, 0)}
                className="font-ui text-xs tracking-[0.08em] text-[var(--text-muted)] underline underline-offset-2"
              >
                {t("remove")}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <aside className="border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6">
        <h2 className="mb-4 font-display text-xl font-medium tracking-[0.05em] text-[var(--text-display)] uppercase">
          {t("summary")}
        </h2>
        <div className="flex justify-between py-2 font-body text-[17px] text-[var(--text-secondary)]">
          <span>{t("subtotal")}</span>
          <span>{km(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between gap-4 py-2 font-body text-[17px] text-[var(--text-secondary)]">
          <span>{t("delivery")}</span>
          <span className="text-right">{t("deliveryLater")}</span>
        </div>
        <hr className="hk-rule my-3.5" />
        {blocked ? (
          <span aria-disabled="true" className={`${PRIMARY} w-full cursor-not-allowed opacity-45`}>
            {t("checkout")}
          </span>
        ) : (
          <Link href="/blagajna" className={`${PRIMARY} w-full`}>
            {t("checkout")}
          </Link>
        )}
      </aside>
    </div>
  );
}
