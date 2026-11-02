import { describe, expect, it } from "vitest";
import { classifyProduct } from "@/features/catalog/classify";
import { DUO_MARKERS, METALLIC_MARKERS, markerColour } from "@/features/catalog/marker-colours";
import { productDetails } from "@/features/catalog/product-details";

describe("marker colours", () => {
  it("covers the 48 Duo and 10 metallic numbers in the sheet", () => {
    const duo =
      "10,130,131,132,144,145,146,147,148,149,150,151,152,153,154,158,20,201,202,203,204,205,206,207,208,209,210,211,212,25,27,29,31,34,35,36,38,43,45,46,47,48,50,51,55,57,63,65".split(
        ",",
      );
    const metallic = "136,137,140,141,142,143,144,145,184,195".split(",");
    expect(Object.keys(DUO_MARKERS).sort()).toEqual([...duo].sort());
    expect(Object.keys(METALLIC_MARKERS).sort()).toEqual([...metallic].sort());
    for (const n of duo) expect(classifyProduct(`Akrilni marker Art-X Duo ${n}`).colourFamily).toBeTruthy();
    for (const n of metallic)
      expect(classifyProduct(`Akrilni metalik marker Art-X ${n}`).colourFamily).toBeTruthy();
  });

  it("the same number means different colours in the two lines", () => {
    expect(markerColour("Akrilni marker Art-X Duo 144")?.maker).toBe("Açık Mercan");
    expect(markerColour("Akrilni metalik marker Art-X 144")?.maker).toBe("Metalik Siyah");
    expect(classifyProduct("Akrilni metalik marker Art-X 140").colourFamily).toBe("zlatne");
  });

  it("flags what sources disagree on", () => {
    expect(productDetails("Akrilni marker Art-X Duo 205").reviewNote).toMatch(/ne slažu/);
    expect(productDetails("Akrilni metalik marker Art-X 136").reviewNote).toMatch(/Provjeriti/);
  });
});

describe("productDetails", () => {
  it("reads the colour and the line's specs", () => {
    expect(productDetails("Akrilna boja - Grey Blue - Sivoplava")).toMatchObject({
      manufacturer: "Rich",
      line: "Master Acrylic",
      colourName: "Sivoplava",
      colourNameMaker: "Grey Blue",
      colourCode: null,
    });
    expect(productDetails("Akrilni marker Art-X Duo 48")).toMatchObject({
      manufacturer: "Rich",
      line: "Art-X Acrylic Duo Marker",
      colourName: "Okeansko plava",
      colourNameMaker: "Okyanus Mavi",
      colourCode: "48",
    });
  });

  it("uses the specific line, not plain acrylic, for variants of acrylic", () => {
    expect(productDetails("Akrilna boja florescentna - Green - Zelena").line).toMatch(/florescentne/);
    expect(productDetails("Akrilna boja Multi Titanium Metalik - Silver - Srebrena").line).toBe(
      "Multi Titanium Metallic",
    );
  });

  it("says so instead of inventing specs", () => {
    const oil = productDetails("Uljana boja Art-X, Buff Titanium");
    expect(oil).toMatchObject({
      description: null,
      specs: null,
      colourNameMaker: "Buff Titanium",
      manufacturer: "Rich",
      line: "Art-X Oil Paint",
    });
    expect(oil.reviewNote).toMatch(/nisu u katalogu/);
    expect(productDetails("Akrilna boja - Gardenia - Gardenija").reviewNote).toMatch(/procjena/);
    expect(productDetails("Gumena špatula").description).toBeNull();
  });
});
