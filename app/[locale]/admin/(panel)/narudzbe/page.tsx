import { getFormatter, getTranslations } from "next-intl/server";
import { FIELD_CLASS } from "@/components/atoms/Field";
import { PageTitle } from "@/components/atoms/PageTitle";
import { Pagination } from "@/components/molecules/Pagination";
import { listOrders } from "@/features/orders/admin";
import type { OrderStatus } from "@/generated/prisma/enums";
import { Link } from "@/i18n/navigation";
import { km } from "@/lib/money";
import { activeQuery, pageParam, param, type SearchParams } from "@/lib/search-params";

const STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const t = await getTranslations("orders");
  const c = await getTranslations("common");
  const format = await getFormatter();
  const status = param(sp.status);
  const page = pageParam(sp.strana);
  const data = await listOrders({
    status: STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined,
    page,
  });
  return (
    <>
      <PageTitle>{t("title")}</PageTitle>
      <form method="get" className="mb-6 flex items-end gap-3">
        <label className="block w-56 font-ui text-xs text-[var(--text-secondary)]">
          {t("status")}
          <select name="status" defaultValue={status} className={`${FIELD_CLASS} mt-1`}>
            <option value="">{c("all")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status${s}`)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-[38px] rounded-[2px] border border-[var(--accent)] px-4 font-ui text-sm text-[var(--accent-bright)]"
        >
          {c("filter")}
        </button>
      </form>
      {data.rows.length === 0 ? (
        <p className="text-[var(--text-muted)]">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="text-xs text-[var(--text-muted)]">
              <tr className="border-b border-[var(--border-strong)]">
                <th className="py-2 pr-3 font-normal">{t("number")}</th>
                <th className="py-2 pr-3 font-normal">{t("date")}</th>
                <th className="py-2 pr-3 font-normal">{t("customer")}</th>
                <th className="py-2 pr-3 text-right font-normal">{t("total")}</th>
                <th className="py-2 pr-3 font-normal">{t("status")}</th>
                <th className="py-2 font-normal">{t("payment")}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((o) => (
                <tr key={o.id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/admin/narudzbe/${o.id}`}
                      className="text-[var(--accent-bright)] underline underline-offset-2"
                    >
                      {o.number}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{format.dateTime(o.createdAt, "long")}</td>
                  <td className="py-2 pr-3">{o.customerName}</td>
                  <td className="py-2 pr-3 text-right">{km(o.total)}</td>
                  <td className="py-2 pr-3">{t(`status${o.status}`)}</td>
                  <td className="py-2">
                    {t(`method${o.paymentMethod}`)} · {t(`pay${o.paymentStatus}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pathname="/admin/narudzbe" page={page} pages={data.pages} query={activeQuery({ status })} />
    </>
  );
}
