import "server-only";
import sharp from "sharp";
import { IMAGE_WIDTHS } from "@/lib/media";
import { putObject } from "@/server/storage";

export { IMAGE_WIDTHS };

export type ImageSize = { width: number; height: number; data: Buffer };

/** WebP copies of a photo, never enlarged. Sizes the original doesn't reach are left out. */
export async function resizeImage(original: Buffer): Promise<ImageSize[]> {
  const meta = await sharp(original).rotate().toBuffer({ resolveWithObject: true });
  const widths = IMAGE_WIDTHS.filter((w) => w <= meta.info.width);
  const targets = widths.length ? widths : [meta.info.width];
  return Promise.all(
    targets.map(async (width) => {
      const { data, info } = await sharp(meta.data)
        .resize({ width })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      return { width: info.width, height: info.height, data };
    }),
  );
}

/** Stores every size as `<prefix>/<width>.webp` and returns the largest size's dimensions. */
export async function storeImageSizes(prefix: string, original: Buffer) {
  const sizes = await resizeImage(original);
  await Promise.all(sizes.map((s) => putObject(`${prefix}/${s.width}.webp`, s.data, "image/webp")));
  const largest = sizes.at(-1)!;
  return { width: largest.width, height: largest.height, widths: sizes.map((s) => s.width) };
}
