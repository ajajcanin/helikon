import type { Prisma } from "@/generated/prisma/client";
import type { Tx } from "@/server/db";

export type AuditActor = { id: string | null; name: string | null };
export const SYSTEM_ACTOR: AuditActor = { id: null, name: "Sistem" };

export type AuditEntry = {
  action: string;
  table: string;
  recordId?: string | number | null;
  /** Bosnian, human-readable. Never customer data. */
  summary?: string;
  changes?: Prisma.InputJsonValue;
};

/**
 * Write one audit-log entry inside the same transaction as the change.
 * If logging fails, the change fails too: there is never a change without a record.
 */
export async function audit(tx: Tx, actor: AuditActor, entry: AuditEntry) {
  await tx.auditLog.create({
    data: {
      userId: actor.id,
      userName: actor.name,
      action: entry.action,
      tableName: entry.table,
      recordId: entry.recordId == null ? null : String(entry.recordId),
      summary: entry.summary ?? null,
      changes: entry.changes ?? undefined,
    },
  });
}

/** { field: [old, new] } for the fields that actually changed. */
export function diff<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): Record<string, [unknown, unknown]> {
  const out: Record<string, [unknown, unknown]> = {};
  for (const key of Object.keys(after)) {
    const a = normalize(before[key]);
    const b = normalize(after[key]);
    if (JSON.stringify(a) !== JSON.stringify(b)) out[key] = [a, b];
  }
  return out;
}

function normalize(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === "object" && "toFixed" in v) return (v as { toString(): string }).toString();
  return v ?? null;
}
