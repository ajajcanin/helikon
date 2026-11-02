import { expect, it } from "vitest";
import { km } from "@/lib/money";

it("formats prices the Bosnian way, independent of the browser", () => {
  expect(km(5)).toBe("5,00 KM");
  expect(km("13.3")).toBe("13,30 KM");
  expect(km(1234.5)).toBe("1.234,50 KM");
  expect(km(1234567)).toBe("1.234.567,00 KM");
  expect(km(0)).toBe("0,00 KM");
  expect(km(-2.5)).toBe("-2,50 KM");
});
