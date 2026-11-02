import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { db } from "@/server/db";

const PAGE_SIZE = 50;

export async function listOrders({ status, page = 1 }: { status?: OrderStatus; page?: number }) {
  const where = status ? { status } : {};
  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        createdAt: true,
        customerName: true,
        total: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
      },
    }),
    db.order.count({ where }),
  ]);
  return {
    total,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    rows: rows.map((r) => ({ ...r, total: r.total.toNumber() })),
  };
}

export async function getOrder(id: number) {
  const order = await db.order.findUnique({
    where: { id },
    include: { lines: { orderBy: { id: "asc" } }, events: { orderBy: { at: "asc" } } },
  });
  if (!order) return null;
  return {
    ...order,
    subtotal: order.subtotal.toNumber(),
    deliveryPrice: order.deliveryPrice.toNumber(),
    total: order.total.toNumber(),
    lines: order.lines.map((l) => ({
      id: l.id,
      sku: l.sku,
      name: l.name,
      size: l.size,
      qty: l.qty,
      unitPrice: l.unitPrice.toNumber(),
      lineTotal: l.lineTotal.toNumber(),
    })),
  };
}

const PAYMENT_NEXT: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: ["PAID"],
  PAID: ["REFUNDED"],
  REFUNDED: [],
};

export async function setPaymentStatus(id: number, to: PaymentStatus, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, select: { number: true, paymentStatus: true } });
    if (!order) throw new UserError("Narudžba ne postoji.");
    if (!PAYMENT_NEXT[order.paymentStatus].includes(to))
      throw new UserError("Ta promjena plaćanja nije moguća.");
    await tx.order.update({ where: { id }, data: { paymentStatus: to } });
    await audit(tx, actor, {
      action: "status",
      table: "order",
      recordId: id,
      summary: `Narudžba ${order.number}: plaćanje ${order.paymentStatus} → ${to}`,
      changes: { paymentStatus: [order.paymentStatus, to] },
    });
  });
}

const money = (value: string | null) => {
  const text = (value ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new UserError("Iznos mora biti broj, npr. 8,50.");
  return text;
};

export const listDeliveryRates = async () => {
  const rows = await db.deliveryRate.findMany({
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    include: { _count: { select: { orders: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price.toFixed(2),
    freeFrom: r.freeFrom?.toFixed(2) ?? "",
    active: r.active,
    orders: r._count.orders,
  }));
};

export type DeliveryInput = { name: string; price: string; freeFrom: string; active: boolean };

function parseDelivery(input: DeliveryInput) {
  const name = input.name.trim();
  if (name.length < 2) throw new UserError("Naziv je prekratak.");
  return {
    name,
    price: money(input.price),
    freeFrom: input.freeFrom.trim() ? money(input.freeFrom) : null,
    active: input.active,
  };
}

export async function createDeliveryRate(input: DeliveryInput, actor: AuditActor) {
  const data = parseDelivery(input);
  await db.$transaction(async (tx) => {
    const rate = await tx.deliveryRate.create({ data });
    await audit(tx, actor, {
      action: "create",
      table: "delivery_rate",
      recordId: rate.id,
      summary: `Nova dostava: ${data.name}`,
    });
  });
}

export async function updateDeliveryRate(id: number, input: DeliveryInput, actor: AuditActor) {
  const data = parseDelivery(input);
  await db.$transaction(async (tx) => {
    await tx.deliveryRate.update({ where: { id }, data });
    await audit(tx, actor, {
      action: "update",
      table: "delivery_rate",
      recordId: id,
      summary: `Dostava izmijenjena: ${data.name}`,
    });
  });
}

/** Used rates stay, because old orders refer to them: switch them off instead. */
export async function deleteDeliveryRate(id: number, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const rate = await tx.deliveryRate.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });
    if (!rate) throw new UserError("Dostava ne postoji.");
    if (rate._count.orders > 0)
      throw new UserError("Ovu dostavu koriste narudžbe. Isključite je umjesto brisanja.");
    await tx.deliveryRate.delete({ where: { id } });
    await audit(tx, actor, {
      action: "delete",
      table: "delivery_rate",
      recordId: id,
      summary: `Obrisana dostava: ${rate.name}`,
    });
  });
}
