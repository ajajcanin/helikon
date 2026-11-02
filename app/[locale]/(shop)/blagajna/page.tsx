import { getTranslations } from "next-intl/server";
import { CheckoutForm } from "@/features/orders/components/CheckoutForm";
import { db } from "@/server/db";
import { env } from "@/server/env";

export default async function CheckoutPage() {
  const [t, rates] = await Promise.all([
    getTranslations("shop"),
    db.deliveryRate.findMany({ where: { active: true }, orderBy: [{ sort: "asc" }, { id: "asc" }] }),
  ]);
  return (
    <div className="mx-auto max-w-[1100px] px-6 pt-12 pb-[88px]">
      <span className="hk-eyebrow">{t("checkoutEyebrow")}</span>
      <h1 className="mt-2.5 mb-7 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] uppercase md:text-[42px]">
        {t("checkoutTitle")}
      </h1>
      <CheckoutForm
        turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        rates={rates.map((r) => ({
          id: r.id,
          name: r.name,
          price: r.price.toFixed(2),
          freeFrom: r.freeFrom?.toFixed(2) ?? null,
        }))}
      />
    </div>
  );
}
