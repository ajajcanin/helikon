import { setRequestLocale } from "next-intl/server";
import { ShopHome } from "@/features/catalog/components/shop/ShopHome";
import { ShopChrome } from "@/features/settings/components/ShopChrome";

/** Always read fresh: stock and prices must be current. */
export const dynamic = "force-dynamic";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ShopChrome>
      <ShopHome />
    </ShopChrome>
  );
}
