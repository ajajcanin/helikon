import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { IMAGE_WIDTHS, resizeImage, storeImageSizes } from "@/server/images";
import { getObject, presignUpload } from "@/server/storage";

const photo = (width: number) =>
  sharp({ create: { width, height: Math.round(width / 2), channels: 3, background: "#b8905a" } })
    .png()
    .toBuffer();

describe("resizeImage", () => {
  it("makes every size, and never enlarges", async () => {
    const big = await resizeImage(await photo(2000));
    expect(big.map((s) => s.width)).toEqual([...IMAGE_WIDTHS]);
    const small = await resizeImage(await photo(500));
    expect(small.map((s) => s.width)).toEqual([320]);
    const tiny = await resizeImage(await photo(100));
    expect(tiny.map((s) => s.width)).toEqual([100]);
  });
});

// Needs the local S3 server from Docker (./setup.sh); skipped where it isn't configured.
describe.skipIf(!process.env.S3_ENDPOINT)("object storage", () => {
  it("stores the sizes and accepts a direct upload", async () => {
    const admin = new S3Client({
      region: "auto",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    });
    await admin.send(new CreateBucketCommand({ Bucket: process.env.S3_BUCKET })).catch(() => undefined);

    const prefix = `test/${Date.now()}`;
    const stored = await storeImageSizes(prefix, await photo(700));
    expect(stored.widths).toEqual([320, 640]);
    const meta = await sharp(await getObject(`${prefix}/640.webp`)).metadata();
    expect(meta.format).toBe("webp");

    const url = await presignUpload(`${prefix}/original.png`, "image/png");
    const res = await fetch(url, { method: "PUT", body: "x", headers: { "content-type": "image/png" } });
    expect(res.ok).toBe(true);
  });
});

describe.skipIf(!process.env.S3_ENDPOINT)("uploads", () => {
  it("makes sizes from a direct upload, removes the original, and refuses what isn't an image", async () => {
    const { requestUpload, finishUpload, deleteImage } = await import("@/server/uploads");
    const send = async (body: Uint8Array<ArrayBuffer> | string, type: string) => {
      const asked = await requestUpload({ contentType: type, size: 100 });
      const res = await fetch(asked.url, { method: "PUT", body, headers: { "content-type": type } });
      expect(res.ok).toBe(true);
      return asked.key;
    };
    const key = await send(await photo(700), "image/png");
    const done = await finishUpload(key, "products");
    expect(done).toMatchObject({ width: 640 });
    expect(done.storageKey).toMatch(/^products\/[0-9a-f-]{36}$/);
    await expect(getObject(key)).rejects.toThrow();
    await deleteImage(done.storageKey, [320, 640]);

    const fake = await send("<script>alert(1)</script>", "image/png");
    await expect(finishUpload(fake, "products")).rejects.toThrow(/slika/);
    await expect(getObject(fake)).rejects.toThrow();

    await expect(requestUpload({ contentType: "application/pdf", size: 100 })).rejects.toThrow(/JPG/);
    await expect(requestUpload({ contentType: "image/png", size: 99_000_000 })).rejects.toThrow(/25 MB/);
    await expect(finishUpload("../tajna", "products")).rejects.toThrow(/Neispravan/);
  });
});
