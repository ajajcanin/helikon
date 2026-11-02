import type { ReactNode } from "react";
import { ShopChrome } from "@/features/settings/components/ShopChrome";

/** Always read fresh: stock and prices must be current. */
export const dynamic = "force-dynamic";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <ShopChrome>{children}</ShopChrome>;
}
