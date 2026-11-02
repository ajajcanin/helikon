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
