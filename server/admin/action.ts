import "server-only";
import { revalidateTag } from "next/cache";
import type { z } from "zod";
import type { Role } from "@/generated/prisma/enums";
import { logger } from "@/server/logger";
import { type AdminUser, ForbiddenError, requireRole } from "./session";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fields?: Record<string, string> };

/**
 * Every admin write: 1) session + role, 2) Zod, 3) the write (with its audit-log entry in the same
 * transaction, done by the handler), 4) public cache tags refreshed. Errors come back as text, never thrown.
 */
export function adminAction<S extends z.ZodType, T>(
  schema: S,
  handler: (input: z.infer<S>, user: AdminUser) => Promise<{ data: T; tags?: string[]; message?: string }>,
  opts: { role?: Role } = {},
) {
  return async (input: z.input<S>): Promise<ActionResult<T>> => {
    let user: AdminUser;
    try {
      user = await requireRole(opts.role);
    } catch (e) {
      return { ok: false, error: e instanceof ForbiddenError ? e.message : "Niste prijavljeni." };
    }
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const i of parsed.error.issues) fields[i.path.join(".")] ??= i.message;
      return { ok: false, error: "Provjerite označena polja.", fields };
    }
    try {
      const res = await handler(parsed.data, user);
      for (const tag of new Set(res.tags ?? [])) revalidateTag(tag, "max");
      return { ok: true, data: res.data, message: res.message };
    } catch (e) {
      if (e instanceof ForbiddenError || e instanceof UserError) return { ok: false, error: e.message };
      logger.error({ err: e, user: user.id }, "admin action failed");
      return { ok: false, error: "Nešto nije u redu. Pokušajte ponovo." };
    }
  };
}

/** An error whose message can be shown to the user as-is. */
export class UserError extends Error {}
