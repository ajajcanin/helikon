import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { db } from "@/server/db";

/** From a product's address in the shop to its edit page, for the bar staff see above the shop. */
export default async function ProductBySlug({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await db.product.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { id: true },
  });
  if (!product) notFound();
  redirect({ href: `/admin/artikli/${product.id}`, locale });
}
