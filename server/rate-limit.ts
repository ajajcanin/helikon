import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/server/db";
import { logger } from "@/server/logger";

/**
 * Fixed-window limit kept in Postgres, because Vercel instances don't share memory. Returns false when over the limit.
 * Keys are hashed, so no address is stored. If the database fails the request is allowed: a form must not break.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const hashed = createHash("sha256").update(key).digest("hex");
  const seconds = windowMs / 1000;
  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_counter (key, count, window_start) VALUES (${hashed}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_counter.window_start < now() - make_interval(secs => ${seconds}) THEN 1 ELSE rate_counter.count + 1 END,
        window_start = CASE WHEN rate_counter.window_start < now() - make_interval(secs => ${seconds}) THEN now() ELSE rate_counter.window_start END
      RETURNING count`;
    return (rows[0]?.count ?? 0) <= max;
  } catch (err) {
    logger.error({ err }, "rate limit failed");
    return true;
  }
}

/** The caller's address as Vercel reports it. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
