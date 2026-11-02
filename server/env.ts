import "server-only";
import { z } from "zod";

/** Validated settings. The app refuses to start when something required is missing. */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  APP_URL: z.url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET mora imati najmanje 32 znaka"),
  NEXT_PUBLIC_SITE_URL: z.url().default("https://helikon.ba"),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Helikon <info@helikon.ba>"),
  // Set locally to send everything to Mailpit instead of Resend.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(1026),
  // Empty until Cloudflare is set up: the Turnstile check is then skipped.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  // Cloudflare R2 (S3 API). A local S3 server in development.
  S3_ENDPOINT: z.url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  NEXT_PUBLIC_MEDIA_URL: z.url().optional(),
  CRON_SECRET: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export const env = schema.parse(process.env);
