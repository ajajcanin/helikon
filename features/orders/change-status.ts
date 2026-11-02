import type { OrderStatus } from "@/generated/prisma/enums";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { db } from "@/server/db";
import { canTransition, returnsStock } from "./status";

/** Moves an order along its flow, returns the goods to stock when cancelled or returned, and records who did it. */
export async function changeOrderStatus(orderId: number, to: OrderStatus, actor: AuditActor, note?: string) {
  return db.$transaction(async (tx) => {
    // Locks the row: two staff members can't cancel the same order and return its stock twice.
    const locked = await tx.$queryRaw<{ status: OrderStatus }[]>`
      SELECT status FROM "order" WHERE id = ${orderId} FOR UPDATE`;
    const from = locked[0]?.status;
    if (!from) throw new UserError("Narudžba ne postoji.");
    if (!canTransition(from, to)) throw new UserError(`Narudžba ne može iz statusa ${from} u ${to}.`);

    if (returnsStock(to)) {
      const lines = await tx.orderLine.findMany({
        where: { orderId },
        select: { variantId: true, qty: true },
      });
      for (const line of lines) {
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stockQty: { increment: line.qty } },
        });
      }
      await tx.stockMovement.createMany({
        data: lines.map((l) => ({
          variantId: l.variantId,
          delta: l.qty,
          reason: to === "CANCELLED" ? ("ORDER_CANCELLED" as const) : ("RETURN" as const),
          orderId,
        })),
      });
    }

    const order = await tx.order.update({ where: { id: orderId }, data: { status: to } });
    await tx.orderEvent.create({
      data: { orderId, fromStatus: from, toStatus: to, note, userId: actor.id, userName: actor.name },
    });
    await audit(tx, actor, {
      action: "status",
      table: "order",
      recordId: orderId,
      summary: `Narudžba ${order.number}: ${from} → ${to}`,
      changes: { status: [from, to] },
    });
    return order;
  });
}
