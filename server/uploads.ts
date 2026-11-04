import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { UserError } from "@/server/admin/action";
import { env } from "@/server/env";
import { storeImageSizes } from "@/server/images";
import { deleteObject, getObject, presignUpload } from "@/server/storage";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 25 * 1024 * 1024;

function requireStorage() {
  if (!env.S3_ENDPOINT || !env.S3_BUCKET || !env.NEXT_PUBLIC_MEDIA_URL) {
    throw new UserError("Spremište slika još nije podešeno.");
  }
}

/** A short-lived address the browser uploads to directly, because Vercel limits request bodies to about 4.5 MB. */
export async function requestUpload(input: { contentType: string; size: number }) {
  requireStorage();
  if (!TYPES.includes(input.contentType)) throw new UserError("Slika mora biti JPG, PNG ili WEBP.");
  if (input.size > MAX_BYTES) throw new UserError("Slika može imati najviše 25 MB.");
  const key = `uploads/${randomUUID()}`;
  return { key, url: await presignUpload(key, input.contentType) };
}

/**
 * Checks the uploaded file really is an image, stores its sizes under `folder`, and removes the original.
 * `name` makes the folder recognisable in the bucket. The random part stays because a new upload must get a new key.
 */
export async function finishUpload(key: string, folder: "products" | "articles", name?: string) {
  requireStorage();
  if (!/^uploads\/[0-9a-f-]{36}$/.test(key)) throw new UserError("Neispravan fajl.");
  const original = await getObject(key);
  try {
    const meta = await sharp(original).metadata();
    if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) throw new Error("format");
    const storageKey = name ? `${folder}/${name}-${randomUUID().slice(0, 8)}` : `${folder}/${randomUUID()}`;
    const stored = await storeImageSizes(storageKey, original);
    return { storageKey, width: stored.width, height: stored.height };
  } catch {
    throw new UserError("Fajl nije ispravna slika.");
  } finally {
    await deleteObject(key).catch(() => undefined);
  }
}

export async function deleteImage(storageKey: string, widths: number[]) {
  await Promise.all(widths.map((w) => deleteObject(`${storageKey}/${w}.webp`).catch(() => undefined)));
}
