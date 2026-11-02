import "server-only";
import { env } from "@/server/env";
import { logger } from "@/server/logger";

/** Cloudflare Turnstile check. Skipped while no secret is configured, so the form keeps working until then. */
export async function verifyTurnstile(token: unknown): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
    });
    return ((await res.json()) as { success?: boolean }).success === true;
  } catch (err) {
    logger.warn({ err }, "turnstile verify failed");
    return false;
  }
}
