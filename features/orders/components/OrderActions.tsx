"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { useAdminAction } from "@/lib/use-admin-action";
import { changePayment, setOrderStatus } from "../actions";
import { canTransition } from "../status";

const NEXT: Exclude<OrderStatus, "NEW">[] = [
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export function OrderActions({
  id,
  status,
  payment,
}: {
  id: number;
  status: OrderStatus;
  payment: PaymentStatus;
}) {
  const t = useTranslations("orders");
  const { run, pending, error } = useAdminAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {NEXT.filter((to) => canTransition(status, to)).map((to) => (
        <Button
          key={to}
          variant={to === "CANCELLED" || to === "RETURNED" ? "danger" : "primary"}
          disabled={pending}
          onClick={() => {
            if (to !== "CANCELLED" && to !== "RETURNED") run(() => setOrderStatus({ orderId: id, to }));
            else if (window.confirm(`${t(`status${to}`)}?`)) run(() => setOrderStatus({ orderId: id, to }));
          }}
        >
          {t(`status${to}`)}
        </Button>
      ))}
      {payment === "PENDING" && (
        <Button disabled={pending} onClick={() => run(() => changePayment({ id, to: "PAID" }))}>
          {t("markPaid")}
        </Button>
      )}
      {payment === "PAID" && (
        <Button disabled={pending} onClick={() => run(() => changePayment({ id, to: "REFUNDED" }))}>
          {t("markRefunded")}
        </Button>
      )}
      {error && <Caption tone="error">{error}</Caption>}
    </div>
  );
}
