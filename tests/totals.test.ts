import { describe, expect, it } from "vitest";
import { computeTotals, includedTax } from "@/features/orders/totals";

describe("computeTotals", () => {
  it("adds lines and delivery without float errors", () => {
    const t = computeTotals(
      [
        { unitPrice: "0.10", qty: 3, taxRate: 0 },
        { unitPrice: "13.30", qty: 2, taxRate: 0 },
      ],
      { price: "8.00" },
    );
    expect(t.subtotal.toFixed(2)).toBe("26.90");
    expect(t.total.toFixed(2)).toBe("34.90");
  });

  it("makes delivery free from the threshold, not below it", () => {
    const line = (unitPrice: string) => [{ unitPrice, qty: 1, taxRate: 0 }];
    expect(computeTotals(line("99.99"), { price: "8", freeFrom: "100" }).deliveryPrice.toFixed(2)).toBe(
      "8.00",
    );
    expect(computeTotals(line("100.00"), { price: "8", freeFrom: "100" }).deliveryPrice.toFixed(2)).toBe(
      "0.00",
    );
  });

  it("reports the PDV inside gross prices, and none at rate 0", () => {
    expect(includedTax("117.00", 17).toFixed(2)).toBe("17.00");
    expect(computeTotals([{ unitPrice: "117", qty: 1, taxRate: 0 }], { price: 0 }).taxTotal.toFixed(2)).toBe(
      "0.00",
    );
    expect(computeTotals([{ unitPrice: "117", qty: 2, taxRate: 17 }], { price: 0 }).taxTotal.toFixed(2)).toBe(
      "34.00",
    );
  });
});
