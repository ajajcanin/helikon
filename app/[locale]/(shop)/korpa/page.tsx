import { getTranslations } from "next-intl/server";
import { CartView } from "@/features/orders/components/CartView";
import { cachedCategoryTree } from "@/server/public/cached";

/** Always read fresh. */
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [t, tree] = await Promise.all([getTranslations("shop"), cachedCategoryTree()]);
  return (
    <div className="mx-auto max-w-[1000px] px-6 pt-12 pb-[88px]">
      <span className="hk-eyebrow">{t("cartEyebrow")}</span>
      <h1 className="mt-2.5 mb-7 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] uppercase md:text-[42px]">
        {t("cartTitle")}
      </h1>
      <CartView firstCategoryHref={tree[0] ? `/kategorija/${tree[0].slug}` : "/"} />
    </div>
  );
}
