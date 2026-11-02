import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db";
import { logger } from "@/server/logger";

const LOCK_AFTER = 5;
const LOCK_MINUTES = 15;

/**
 * Better Auth runs inside our app; its tables (user, session, account, verification, rate_limit) live in our
 * Postgres. Staff only: e-mail + password, no public signup, lock after 5 failed tries. Customers check out as guests.
 */
export const auth = betterAuth({
  appName: "Helikon",
  baseURL: process.env.APP_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 10,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "UREDNIK" },
      active: { type: "boolean", input: false, defaultValue: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: { "/sign-in/email": { window: 60, max: 10 } },
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: (process.env.APP_URL ?? "").startsWith("https://"),
    ipAddress: { disableIpTracking: true },
  },
  databaseHooks: {
    session: {
      create: {
        // Deactivated users can't log in.
        async before(session) {
          const u = await db.user.findUnique({ where: { id: session.userId }, select: { active: true } });
          if (!u?.active) return false;
          return { data: { ...session, ipAddress: null } };
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = String((ctx.body as { email?: string })?.email ?? "").toLowerCase();
      const u = await db.user.findUnique({ where: { email }, select: { lockedUntil: true, active: true } });
      if (u?.lockedUntil && u.lockedUntil > new Date()) {
        throw new APIError("FORBIDDEN", { message: "LOCKED", code: "ACCOUNT_LOCKED" });
      }
      if (u && !u.active) throw new APIError("FORBIDDEN", { message: "INACTIVE", code: "ACCOUNT_INACTIVE" });
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = String((ctx.body as { email?: string })?.email ?? "").toLowerCase();
      const failed = isAPIError(ctx.context.returned);
      try {
        const u = await db.user.findUnique({ where: { email }, select: { id: true, failedLogins: true } });
        if (!u) return;
        if (failed) {
          const n = u.failedLogins + 1;
          await db.user.update({
            where: { id: u.id },
            data: {
              failedLogins: n,
              lockedUntil: n >= LOCK_AFTER ? new Date(Date.now() + LOCK_MINUTES * 60_000) : undefined,
            },
          });
          if (n >= LOCK_AFTER) logger.warn({ user: u.id }, "account locked after failed logins");
        } else if (u.failedLogins > 0) {
          await db.user.update({ where: { id: u.id }, data: { failedLogins: 0, lockedUntil: null } });
        }
      } catch (err) {
        logger.error({ err }, "login tracking failed");
      }
    }),
  },
  plugins: [nextCookies()],
});
