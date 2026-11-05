import { storedWidths } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { db } from "@/server/db";
import { deleteImage } from "@/server/uploads";

export const listPhotos = (productId: number) =>
  db.productPhoto.findMany({
    where: { productId },
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    select: { id: true, storageKey: true, alt: true, width: true, height: true, variantId: true },
  });

export type AdminPhoto = Awaited<ReturnType<typeof listPhotos>>[number];

/**
 * Names the product's photos in storage: its first šifra, then its slug, so a folder can be found by šifra.
 * They keep the name if the product changes, since the database holds the path.
 */
export async function photoName(productId: number) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true, variants: { orderBy: { sort: "asc" }, take: 1, select: { sku: true } } },
  });
  if (!product) throw new UserError("Artikal ne postoji.");
  const sku = product.variants[0]?.sku;
  return sku ? `${slugify(sku)}-${product.slug}` : product.slug;
}

/** Sizes can share one file, so it goes only when no photo uses it any more. */
async function deleteUnusedFile({ storageKey, width }: { storageKey: string; width: number }) {
  const users = await db.productPhoto.count({ where: { storageKey } });
  if (users === 0) await deleteImage(storageKey, storedWidths(width));
}

export async function addPhoto(
  productId: number,
  image: { storageKey: string; width: number; height: number },
  actor: AuditActor,
  variantId?: number,
) {
  return db.$transaction(async (tx) => {
    if (variantId) {
      const variant = await tx.productVariant.findFirst({ where: { id: variantId, productId } });
      if (!variant) throw new UserError("Veličina ne postoji.");
    }
    const count = await tx.productPhoto.count({ where: { productId } });
    const photo = await tx.productPhoto.create({ data: { productId, variantId, ...image, sort: count } });
    await audit(tx, actor, {
      action: "update",
      table: "product",
      recordId: productId,
      summary: "Dodana slika artikla",
    });
    return photo;
  });
}

/** Swaps a photo's image in place, so it keeps its position. The old description goes, since it described the old image. */
export async function replacePhoto(
  id: number,
  productId: number,
  image: { storageKey: string; width: number; height: number },
  actor: AuditActor,
) {
  const old = await db.$transaction(async (tx) => {
    const found = await tx.productPhoto.findFirst({ where: { id, productId } });
    if (!found) throw new UserError("Slika ne postoji.");
    await tx.productPhoto.update({ where: { id }, data: { ...image, alt: null } });
    await audit(tx, actor, {
      action: "update",
      table: "product",
      recordId: productId,
      summary: "Zamijenjena slika artikla",
    });
    return found;
  });
  await deleteUnusedFile(old);
}

export async function deletePhoto(id: number, actor: AuditActor) {
  const photo = await db.$transaction(async (tx) => {
    const found = await tx.productPhoto.findUnique({ where: { id } });
    if (!found) throw new UserError("Slika ne postoji.");
    await tx.productPhoto.delete({ where: { id } });
    await audit(tx, actor, {
      action: "update",
      table: "product",
      recordId: found.productId,
      summary: "Obrisana slika artikla",
    });
    return found;
  });
  // After the database change: a leftover file wastes little, a missing one would break the page.
  await deleteUnusedFile(photo);
}
