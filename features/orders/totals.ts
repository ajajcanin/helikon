import { Decimal } from "decimal.js";

type Money = Decimal.Value;

export type TotalsLine = { unitPrice: Money; qty: number; taxRate: Money };
export type TotalsDelivery = { price: Money; freeFrom?: Money | null };

const round = (d: Decimal) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

/** Prices already include PDV. Returns the part of a gross amount that is PDV. */
export function includedTax(gross: Money, rate: Money): Decimal {
  const r = new Decimal(rate);
  if (r.isZero()) return new Decimal(0);
  return round(new Decimal(gross).times(r).dividedBy(r.plus(100)));
}

/** All money for an order. The only place these amounts are calculated. */
export function computeTotals(lines: TotalsLine[], delivery: TotalsDelivery) {
  const computed = lines.map((l) => round(new Decimal(l.unitPrice).times(l.qty)));
  const subtotal = computed.reduce((sum, t) => sum.plus(t), new Decimal(0));
  const free = delivery.freeFrom != null && subtotal.greaterThanOrEqualTo(delivery.freeFrom);
  const deliveryPrice = free ? new Decimal(0) : round(new Decimal(delivery.price));
  const taxTotal = lines.reduce(
    (sum, l, i) => sum.plus(includedTax(computed[i]!, l.taxRate)),
    new Decimal(0),
  );
  return { lineTotals: computed, subtotal, deliveryPrice, taxTotal, total: subtotal.plus(deliveryPrice) };
}
