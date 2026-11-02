"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Caption } from "@/components/atoms/Caption";
import { Input } from "@/components/atoms/Field";
import { SubmitButton } from "@/components/atoms/SubmitButton";
import { Turnstile } from "@/components/atoms/Turnstile";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";
import { displayName } from "@/lib/colour-swatch";
import { km } from "@/lib/money";
import { readCart, submitOrder } from "../checkout-actions";

type Rate = { id: number; name: string; price: string; freeFrom: string | null };
type Cart = Awaited<ReturnType<typeof readCart>>;

const KEY = "hk_checkout_key";

/** Kept until the order succeeds: a retry after a lost connection returns the same order instead of a second one. */
function checkoutKey() {
  try {
    const existing = window.sessionStorage.getItem(KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export function CheckoutForm({ rates, turnstileSiteKey }: { rates: Rate[]; turnstileSiteKey?: string }) {
  const t = useTranslations("shop");
  const router = useRouter();
  const { lines, clear } = useCart();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [rateId, setRateId] = useState(rates[0]?.id);
  const [payment, setPayment] = useState<"CASH_ON_DELIVERY" | "BANK_TRANSFER">("CASH_ON_DELIVERY");
  const [token, setToken] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    customerNote: "",
  });
  const done = useRef(false);
  const key = JSON.stringify(lines);
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  // biome-ignore lint/correctness/useExhaustiveDependencies: key is the serialised form of lines
  useEffect(() => {
    // Also true right after ordering, while the page moves on to the thank-you page.
    if (lines.length === 0) return;
    let current = true;
    readCart(lines, rateId).then((data) => {
      if (current) setCart(data);
    });
    return () => {
      current = false;
    };
  }, [key, rateId]);

  if (lines.length === 0 && !done.current) {
    return (
      <p className="font-body text-lg text-[var(--text-secondary)]">
        {t("cartEmptyTitle")}.{" "}
        <Link href="/" className="text-[var(--accent-bright)] underline underline-offset-4">
          {t("thanksBack")}
        </Link>
      </p>
    );
  }
  if (rates.length === 0)
    return <p className="font-body text-lg text-[var(--text-secondary)]">{t("noDelivery")}</p>;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart || rateId === undefined) return;
    setError(null);
    start(async () => {
      const res = await submitOrder(
        {
          ...form,
          customerNote: form.customerNote || undefined,
          checkoutKey: checkoutKey(),
          paymentMethod: payment,
          deliveryRateId: rateId,
          expectedTotal: cart.total,
          lines,
        },
        token,
      );
      if (res.ok) {
        done.current = true;
        try {
          window.sessionStorage.removeItem(KEY);
        } catch {
          // Nothing to do: the key is only useful for retries.
        }
        router.push(
          `/hvala?broj=${encodeURIComponent(res.number)}${payment === "BANK_TRANSFER" ? "&placanje=virman" : ""}`,
        );
        clear();
        return;
      }
      setError(t(`errors.${res.error}`));
      // Show current prices and stock after any refusal.
      setCart(await readCart(lines, rateId));
    });
  }

  const option =
    "flex cursor-pointer items-center justify-between gap-3 border border-[var(--border-strong)] px-3.5 py-3 font-body text-base has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-subtle)]";
  const legend = "mb-3 font-ui text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase";
  return (
    <form onSubmit={submit} className="grid items-start gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-7">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={t("customerName")}
            required
            minLength={2}
            autoComplete="name"
            value={form.customerName}
            onChange={set("customerName")}
          />
          <Input
            label={t("phone")}
            required
            minLength={6}
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
          />
          <Input
            className="md:col-span-2"
            label={t("email")}
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
          />
          <Input
            className="md:col-span-2"
            label={t("address")}
            required
            minLength={3}
            autoComplete="street-address"
            value={form.address}
            onChange={set("address")}
          />
          <Input
            label={t("city")}
            required
            minLength={2}
            autoComplete="address-level2"
            value={form.city}
            onChange={set("city")}
          />
          <Input
            label={t("postalCode")}
            required
            minLength={3}
            autoComplete="postal-code"
            value={form.postalCode}
            onChange={set("postalCode")}
          />
          <Input
            className="md:col-span-2"
            label={t("note")}
            value={form.customerNote}
            onChange={set("customerNote")}
          />
        </div>
        <fieldset>
          <legend className={legend}>{t("deliveryMethod")}</legend>
          <div className="flex flex-col gap-2">
            {rates.map((rate) => (
              <label key={rate.id} className={option}>
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="delivery"
                    className="accent-[var(--accent)]"
                    checked={rate.id === rateId}
                    onChange={() => setRateId(rate.id)}
                  />
                  {rate.name}
                </span>
                <span className="font-ui text-sm text-[var(--text-secondary)]">
                  {Number(rate.price) === 0 ? t("free") : km(rate.price)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className={legend}>{t("payment")}</legend>
          <div className="flex flex-col gap-2">
            <label className={option}>
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="payment"
                  className="accent-[var(--accent)]"
                  checked={payment === "CASH_ON_DELIVERY"}
                  onChange={() => setPayment("CASH_ON_DELIVERY")}
                />
                {t("payCod")}
              </span>
            </label>
            <label className={option}>
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="payment"
                  className="accent-[var(--accent)]"
                  checked={payment === "BANK_TRANSFER"}
                  onChange={() => setPayment("BANK_TRANSFER")}
                />
                {t("payBank")}
              </span>
            </label>
          </div>
        </fieldset>
        {turnstileSiteKey && <Turnstile siteKey={turnstileSiteKey} onToken={setToken} />}
      </div>
      <aside className="border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6">
        <h2 className="mb-4 font-display text-xl font-medium tracking-[0.05em] text-[var(--text-display)] uppercase">
          {t("summary")}
        </h2>
        {!cart ? (
          <p className="font-ui text-sm text-[var(--text-muted)]">{t("loading")}</p>
        ) : (
          <>
            <ul className="mb-3 flex flex-col gap-2 font-body text-base text-[var(--text-secondary)]">
              {cart.lines.map((line) => (
                <li key={line.variantId} className="flex justify-between gap-3">
                  <span>
                    {line.qty} × {displayName(line)}
                    {line.size ? `, ${line.size}` : ""}
                  </span>
                  <span className="whitespace-nowrap">
                    {km((Number(line.unitPrice) * line.qty).toFixed(2))}
                  </span>
                </li>
              ))}
            </ul>
            <hr className="hk-rule my-3" />
            <div className="flex justify-between py-1 font-body text-[17px] text-[var(--text-secondary)]">
              <span>{t("subtotal")}</span>
              <span>{km(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 font-body text-[17px] text-[var(--text-secondary)]">
              <span>{t("delivery")}</span>
              <span>{Number(cart.deliveryPrice) === 0 ? t("free") : km(cart.deliveryPrice)}</span>
            </div>
            <hr className="hk-rule my-3" />
            <div className="flex justify-between py-1 pb-4 font-display text-[22px] tracking-[0.03em] text-[var(--text-display)]">
              <span>{t("total")}</span>
              <span>{km(cart.total)}</span>
            </div>
          </>
        )}
        <div aria-live="polite">
          {error && (
            <Caption tone="error" className="mb-3">
              {error}
            </Caption>
          )}
        </div>
        <div className="[&>button]:w-full">
          <SubmitButton loading={pending}>{pending ? t("placing") : t("placeOrder")}</SubmitButton>
        </div>
        <p className="mt-3 font-ui text-xs text-[var(--text-muted)]">{t("vatNote")}</p>
      </aside>
    </form>
  );
}
