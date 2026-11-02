import { getCompanySettings } from "@/server/company";
import { db } from "@/server/db";
import { sendMail } from "@/server/email/send";

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

const km = (value: { toFixed(digits: number): string }) => `${value.toFixed(2).replace(".", ",")} KM`;

/** Confirmation to the customer and a notice to the shop. */
export async function sendOrderEmails(orderId: number) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { lines: { orderBy: { id: "asc" } } },
  });
  const company = await getCompanySettings();
  const lines = order.lines.map(
    (l) => `${l.qty} × ${l.name}${l.size ? `, ${l.size}` : ""} (${l.sku}): ${km(l.lineTotal)}`,
  );
  const summary = [
    ...lines,
    `Dostava (${order.deliveryName}): ${km(order.deliveryPrice)}`,
    `Ukupno: ${km(order.total)}`,
  ];
  const bank =
    order.paymentMethod === "BANK_TRANSFER" && company.bankAccount
      ? `Uplatu izvršite na žiro račun ${company.bankAccount}, uz poziv na broj ${order.number}.`
      : null;
  const address = `${order.customerName}, ${order.address}, ${order.postalCode} ${order.city}, ${order.phone}`;
  const html = (intro: string, extra: string[]) =>
    `<p>${escapeHtml(intro)}</p><ul>${summary.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>${extra
      .map((l) => `<p>${escapeHtml(l)}</p>`)
      .join("")}`;

  const thanks = `Zaprimili smo vašu narudžbu ${order.number}. Javit ćemo vam se kada je potvrdimo.`;
  const customerExtra = [`Dostava: ${address}`, ...(bank ? [bank] : [])];
  await sendMail({
    to: order.email,
    subject: `Helikon: narudžba ${order.number}`,
    html: html(thanks, customerExtra),
    text: [thanks, ...summary, ...customerExtra].join("\n"),
  });
  if (company.orderEmail) {
    const notice = `Nova narudžba ${order.number}.`;
    const shopExtra = [
      `Kupac: ${address}, ${order.email}`,
      ...(order.customerNote ? [`Napomena: ${order.customerNote}`] : []),
    ];
    await sendMail({
      to: company.orderEmail,
      replyTo: order.email,
      subject: `Nova narudžba ${order.number}`,
      html: html(notice, shopExtra),
      text: [notice, ...summary, ...shopExtra].join("\n"),
    });
  }
}
