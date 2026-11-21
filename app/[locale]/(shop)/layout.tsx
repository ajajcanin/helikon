import type { ReactNode } from "react";
import { AdminBar } from "@/components/molecules/AdminBar";
import { ShopChrome } from "@/features/settings/components/ShopChrome";

/** Each page decides how it renders: see `revalidate` on the cached ones. */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminBar />
      <ShopChrome>{children}</ShopChrome>
    </>
  );
}
