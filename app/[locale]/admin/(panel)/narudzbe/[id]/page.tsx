import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { getOrder } from "@/features/orders/admin";
import { OrderActions } from "@/features/orders/components/OrderActions";
import { Link } from "@/i18n/navigation";
import { km } from "@/lib/money";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const order = await getOrder(id);
  if (!order) notFound();
  const t = await getTranslations("orders");
  const c = await getTranslations("common");
  const format = await getFormatter();
  const heading = "mb-2 font-display text-base tracking-[0.04em]";
  return (
    <>
      <Link
        href="/admin/narudzbe"
        className="mb-4 inline-block text-[var(--accent-bright)] underline underline-offset-2"
      >
        {c("back")}
      </Link>
      <PageTitle
        intro={`${t(`status${order.status}`)} · ${t(`method${order.paymentMethod}`)} · ${t(`pay${order.paymentStatus}`)}`}
      >
        {order.number}
      </PageTitle>
      <OrderActions id={order.id} status={order.status} payment={order.paymentStatus} />
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className={heading}>{t("customer")}</h2>
          <p>{order.customerName}</p>
          <p className="text-[var(--text-secondary)]">
            {order.email} · {order.phone}
          </p>
        </section>
        <section>
          <h2 className={heading}>{t("address")}</h2>
          <p>{order.address}</p>
          <p className="text-[var(--text-secondary)]">
            {order.postalCode} {order.city} · {order.deliveryName}
          </p>
          {order.customerNote && (
            <p className="mt-2 text-[var(--text-secondary)]">
              {t("note")}: {order.customerNote}
            </p>
          )}
        </section>
      </div>
      <h2 className={`${heading} mt-6`}>{t("lines")}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <tbody>
            {order.lines.map((l) => (
              <tr key={l.id} className="border-b border-[var(--border-subtle)]">
                <td className="py-2 pr-3 text-[var(--text-secondary)]">{l.sku}</td>
                <td className="py-2 pr-3">
                  {l.name}
                  {l.size ? `, ${l.size}` : ""}
                </td>
                <td className="py-2 pr-3 text-right">
                  {l.qty} × {km(l.unitPrice)}
                </td>
                <td className="py-2 text-right">{km(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="mt-3 ml-auto w-64">
        <div className="flex justify-between py-0.5">
          <dt>{t("subtotal")}</dt>
          <dd>{km(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between py-0.5">
          <dt>{t("delivery")}</dt>
          <dd>{km(order.deliveryPrice)}</dd>
        </div>
        <div className="flex justify-between border-t border-[var(--border-strong)] py-1 font-semibold">
          <dt>{t("total")}</dt>
          <dd>{km(order.total)}</dd>
        </div>
      </dl>
      <h2 className={`${heading} mt-6`}>{t("history")}</h2>
      <ul>
        {order.events.map((e) => (
          <li key={e.id} className="py-1 text-[var(--text-secondary)]">
            {format.dateTime(e.at, "long")} · {t(`status${e.toStatus}`)}
            {e.userName ? ` · ${e.userName}` : ""}
          </li>
        ))}
      </ul>
    </>
  );
}
