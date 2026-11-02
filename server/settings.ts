import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { type AuditActor, audit } from "@/server/audit";
import { db } from "@/server/db";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  return row ? (row.value as T) : fallback;
}

export async function setSetting(key: string, value: Prisma.InputJsonValue, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    await tx.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
    await audit(tx, actor, {
      action: "settings",
      table: "setting",
      recordId: key,
      summary: `Postavka ${key}`,
    });
  });
}
