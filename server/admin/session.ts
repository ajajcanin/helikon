import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/generated/prisma/enums";
import type { AuditActor } from "@/server/audit";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export type AdminTheme = "dark" | "light";
export type AdminUser = { id: string; name: string; email: string; role: Role; theme: AdminTheme };

/** Current admin user (or null). Cached per request. */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true, theme: true },
  });
  if (!u?.active) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    theme: u.theme === "light" ? "light" : "dark",
  };
});

/** For pages: redirect to the login page when not logged in, or to the dashboard when the role is missing. */
export async function requirePageUser(role?: Role): Promise<AdminUser> {
  const u = await getAdminUser();
  if (!u) redirect("/admin/prijava");
  if (role === "ADMINISTRATOR" && u.role !== "ADMINISTRATOR") redirect("/admin");
  return u;
}

export class ForbiddenError extends Error {
  constructor(message = "Nemate pravo za ovu radnju.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Every Server Action and admin route handler starts with this. */
export async function requireRole(role?: Role): Promise<AdminUser> {
  const u = await getAdminUser();
  if (!u) throw new ForbiddenError("Niste prijavljeni.");
  if (role === "ADMINISTRATOR" && u.role !== "ADMINISTRATOR") throw new ForbiddenError();
  return u;
}

export const actorOf = (u: AdminUser): AuditActor => ({ id: u.id, name: u.name });
