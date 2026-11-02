import type { OrderStatus } from "@/generated/prisma/enums";

const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => NEXT[from].includes(to);

/** These put the goods back on the shelf. */
export const returnsStock = (to: OrderStatus) => to === "CANCELLED" || to === "RETURNED";
