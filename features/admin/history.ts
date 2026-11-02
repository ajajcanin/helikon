import { db } from "@/server/db";

const PAGE_SIZE = 50;

export const HISTORY_TABLES = [
  "product",
  "product_variant",
  "category",
  "manufacturer",
  "order",
  "delivery_rate",
  "user",
  "setting",
] as const;

export async function listHistory({ table, page = 1 }: { table?: string; page?: number }) {
  const where = table ? { tableName: table } : {};
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, at: true, userName: true, summary: true, action: true, tableName: true },
    }),
    db.auditLog.count({ where }),
  ]);
  return { rows, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
