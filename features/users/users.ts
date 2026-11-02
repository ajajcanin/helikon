import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Role } from "@/generated/prisma/enums";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { auth } from "@/server/auth";
import { db, type Tx } from "@/server/db";

const MIN_PASSWORD = 10;

export const listUsers = () =>
  db.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

async function hash(password: string) {
  if (password.length < MIN_PASSWORD)
    throw new UserError(`Lozinka mora imati najmanje ${MIN_PASSWORD} znakova.`);
  return (await auth.$context).password.hash(password);
}

export async function createUser(
  input: { name: string; email: string; password: string; role: Role },
  actor: AuditActor,
) {
  const name = input.name.trim();
  if (name.length < 2) throw new UserError("Ime je prekratko.");
  const email = z.email().safeParse(input.email.trim().toLowerCase());
  if (!email.success) throw new UserError("E-pošta nije ispravna.");
  const password = await hash(input.password);
  const id = randomUUID();
  await db.$transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { email: email.data } }))
      throw new UserError("Taj korisnik već postoji.");
    await tx.user.create({ data: { id, name, email: email.data, emailVerified: true, role: input.role } });
    await tx.account.create({
      data: { id: randomUUID(), accountId: id, providerId: "credential", userId: id, password },
    });
    await audit(tx, actor, {
      action: "create",
      table: "user",
      recordId: id,
      summary: `Novi korisnik: ${name} (${input.role})`,
    });
  });
}

/** There must always be someone who can manage users. */
async function requireOtherAdmin(tx: Tx, id: number | string) {
  const others = await tx.user.count({
    where: { role: "ADMINISTRATOR", active: true, id: { not: String(id) } },
  });
  if (others === 0) throw new UserError("Mora ostati barem jedan aktivan administrator.");
}

export async function setUserActive(id: string, active: boolean, actor: AuditActor) {
  if (id === actor.id && !active) throw new UserError("Ne možete deaktivirati sami sebe.");
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) throw new UserError("Korisnik ne postoji.");
    if (user.active === active) return;
    if (!active && user.role === "ADMINISTRATOR") await requireOtherAdmin(tx, id);
    await tx.user.update({ where: { id }, data: { active, failedLogins: 0, lockedUntil: null } });
    if (!active) await tx.session.deleteMany({ where: { userId: id } });
    await audit(tx, actor, {
      action: "update",
      table: "user",
      recordId: id,
      summary: `Korisnik ${user.name} ${active ? "aktiviran" : "deaktiviran"}`,
    });
  });
}

export async function setUserRole(id: string, role: Role, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) throw new UserError("Korisnik ne postoji.");
    if (user.role === role) return;
    if (user.role === "ADMINISTRATOR") await requireOtherAdmin(tx, id);
    await tx.user.update({ where: { id }, data: { role } });
    await audit(tx, actor, {
      action: "update",
      table: "user",
      recordId: id,
      summary: `Korisnik ${user.name}: uloga ${user.role} → ${role}`,
      changes: { role: [user.role, role] },
    });
  });
}

/** Logs the person out everywhere. Also lifts a lockout. */
export async function setUserPassword(id: string, password: string, actor: AuditActor) {
  const hashed = await hash(password);
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id } });
    if (!user) throw new UserError("Korisnik ne postoji.");
    const { count } = await tx.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hashed },
    });
    if (count === 0) throw new UserError("Korisnik nema lozinku za promjenu.");
    await tx.user.update({ where: { id }, data: { failedLogins: 0, lockedUntil: null } });
    await tx.session.deleteMany({ where: { userId: id } });
    await audit(tx, actor, {
      action: "update",
      table: "user",
      recordId: id,
      summary: `Promijenjena lozinka: ${user.name}`,
    });
  });
}
