import "server-only";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/server/env";

let client: S3Client | undefined;

function s3() {
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error("Object storage is not configured (S3_* settings)");
  }
  client ??= new S3Client({
    // R2 ignores the region, but the SDK requires one.
    region: "auto",
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true,
    // The SDK would otherwise sign a checksum of an empty body into direct-upload URLs, and the upload gets rejected.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
  });
  return client;
}

function bucket() {
  if (!env.S3_BUCKET) throw new Error("S3_BUCKET is not set");
  return env.S3_BUCKET;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys never change content: a new upload gets a new key.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function getObject(key: string): Promise<Buffer> {
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  return Buffer.from(await res.Body!.transformToByteArray());
}

/** A short-lived URL the admin's browser uploads to directly: Vercel limits request bodies to about 4.5 MB. */
export function presignUpload(key: string, contentType: string) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), {
    expiresIn: 600,
  });
}

export function publicUrl(key: string) {
  return `${env.NEXT_PUBLIC_MEDIA_URL}/${key}`;
}
