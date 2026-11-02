import { storedWidths } from "@/lib/media";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { db } from "@/server/db";
import { deleteImage } from "@/server/uploads";

const MAX_PHOTOS = 8;

export const listPhotos = (productId: number) =>
  db.productPhoto.findMany({
    where: { productId },
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    select: { id: true, storageKey: true, alt: true, width: true, height: true },
  });

export type AdminPhoto = Awaited<ReturnType<typeof listPhotos>>[number];

export async function addPhoto(
  productId: number,
  image: { storageKey: string; width: number; height: number },
  actor: AuditActor,
) {
  return db.$transaction(async (tx) => {
    const count = await tx.productPhoto.count({ where: { productId } });
    if (count >= MAX_PHOTOS) throw new UserError(`Najviše ${MAX_PHOTOS} slika po artiklu.`);
    const photo = await tx.productPhoto.create({ data: { productId, ...image, sort: count } });
    await audit(tx, actor, {
      action: "update",
      table: "product",
      recordId: productId,
      summary: "Dodana slika artikla",
    });
    return photo;
  });
}

export async function updatePhotoAlt(id: number, alt: string, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const photo = await tx.productPhoto.update({ where: { id }, data: { alt: alt.trim() || null } });
    await audit(tx, actor, {
      action: "update",
      table: "product",
      recordId: photo.productId,
      summary: "Izmijenjen opis slike",
    });
  });
}

/** Moves a photo one place. The first photo is the one shown on product cards. */
export async function movePhoto(id: number, direction: "up" | "down", actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const photo = await tx.productPhoto.findUnique({ where: { id } });
    if (!photo) throw new UserError("Slika ne postoji.");
    const all = await tx.productPhoto.findMany({
      where: { productId: photo.productId },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    const from = all.findIndex((p) => p.id === id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= all.length) return;
    const order = all.map((p) => p.id);
    [order[from], order[to]] = [order[to]!, order[from]!];
    for (const [sort, photoId] of order.entries())
      await tx.productPhoto.update({ where: { id: photoId }, data: { sort } });
    await audit(tx, actor, {
      action: "update",
      table: "product",
      recordId: photo.productId,
      summary: "Promijenjen redoslijed slika",
    });
  });
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
  await deleteImage(photo.storageKey, storedWidths(photo.width));
}
