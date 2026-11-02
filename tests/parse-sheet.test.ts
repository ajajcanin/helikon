import { describe, expect, it } from "vitest";
import { cellValue, parseSheetName, parseSheetNumber } from "@/features/catalog/parse-sheet";
import { slugify } from "@/lib/slug";

describe("parseSheetName", () => {
  it.each([
    [
      "Akrilna boja - Grey Blue - Sivoplava, 120ml",
      "Akrilna boja",
      "Akrilna boja - Grey Blue - Sivoplava",
      "120 ml",
    ],
    [
      "Uljana boja Art-X, Buff Titanium, 37 ml",
      "Uljana boja Art-X",
      "Uljana boja Art-X, Buff Titanium",
      "37 ml",
    ],
    ["Šablon Wall Decor Series 50x70 cm", "Šablon Wall Decor Series", "Šablon Wall Decor Series", "50x70 cm"],
    ["Akrilna boja - Red - Crvena -, 60ml", "Akrilna boja", "Akrilna boja - Red - Crvena", "60 ml"],
    [
      "Folija u rolni - Gold - Zlatna,  10.8 cm x 120 m",
      "Folija u rolni",
      "Folija u rolni - Gold - Zlatna",
      "10.8 cm x 120 m",
    ],
    [
      "Akrilni set boja MASTERMIX, 6x60 ml",
      "Akrilni set boja MASTERMIX",
      "Akrilni set boja MASTERMIX",
      "6x60 ml",
    ],
    [
      "Boja za namještaj - White - Bijela, 240ml",
      "Boja za namještaj",
      "Boja za namještaj - White - Bijela",
      "240 ml",
    ],
    [
      "Crystal Resin Transparent, 1000 + 500 ml",
      "Crystal Resin Transparent",
      "Crystal Resin Transparent",
      "1000+500 ml",
    ],
    ["100 slojni lak, 120+60 ml", "100 slojni lak", "100 slojni lak", "120+60 ml"],
    ["Plastični set špatula", "Plastični set špatula", "Plastični set špatula", null],
  ])("%s", (raw, line, product, size) => {
    expect(parseSheetName(raw)).toEqual({ line, product, size });
  });
});

describe("parseSheetNumber", () => {
  it("reads the sheet's number formats", () => {
    expect(parseSheetNumber("13,3")).toBe("13.3");
    expect(parseSheetNumber("1.234,50")).toBe("1234.50");
    expect(parseSheetNumber(12)).toBe("12");
    expect(parseSheetNumber("")).toBeNull();
    expect(parseSheetNumber("abc")).toBeNull();
  });
});

it("cellValue reads rich text, formulas and plain values", () => {
  expect(cellValue({ richText: [{ text: "12," }, { text: "00" }] })).toBe("12,00");
  expect(cellValue({ formula: "A1", result: 5 })).toBe(5);
  expect(cellValue(1001)).toBe(1001);
});

it("slugify handles Bosnian letters", () => {
  expect(slugify("Boja za tačkanje - Đurđica, Šljiva")).toBe("boja-za-tackanje-djurdjica-sljiva");
});
