"use server";

import { z } from "zod";
import { adminAction, SHOP_UNCHANGED } from "@/server/admin/action";
import { actorOf } from "@/server/admin/session";
import { CATALOG } from "@/server/shop-cache";
import { createDeliveryRate, deleteDeliveryRate, setPaymentStatus, updateDeliveryRate } from "./admin";
import { changeOrderStatus } from "./change-status";
import { returnsStock } from "./status";

const schema = z.object({
  orderId: z.number().int().positive(),
  to: z.enum(["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]),
  note: z.string().trim().max(500).optional(),
});

export const setOrderStatus = adminAction(schema, async ({ orderId, to, note }, user) => {
  const order = await changeOrderStatus(orderId, to, actorOf(user), note);
  return { data: { status: order.status }, refresh: returnsStock(to) ? [CATALOG] : [] };
});

const id = z.number().int().positive();

export const changePayment = adminAction(
  z.object({ id, to: z.enum(["PAID", "REFUNDED"]) }),
  async ({ id, to }, user) => {
    await setPaymentStatus(id, to, actorOf(user));
    return { data: undefined };
  },
  SHOP_UNCHANGED,
);

const delivery = z.object({
  name: z.string().max(80),
  price: z.string().max(20),
  freeFrom: z.string().max(20),
  active: z.boolean(),
});

// Delivery rates only show at checkout, which is never cached.
export const addDelivery = adminAction(
  delivery,
  async (input, user) => {
    await createDeliveryRate(input, actorOf(user));
    return { data: undefined };
  },
  SHOP_UNCHANGED,
);

export const editDelivery = adminAction(
  delivery.extend({ id }),
  async ({ id, ...input }, user) => {
    await updateDeliveryRate(id, input, actorOf(user));
    return { data: undefined };
  },
  SHOP_UNCHANGED,
);

export const removeDelivery = adminAction(
  z.object({ id }),
  async ({ id }, user) => {
    await deleteDeliveryRate(id, actorOf(user));
    return { data: undefined };
  },
  SHOP_UNCHANGED,
);
