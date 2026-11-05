import { describe, expect, it } from "vitest";
import { cardPhoto, photosForVariant } from "@/lib/product-photos";

const general = { key: "general", variantId: null };
const small = { key: "60 ml", variantId: 1 };
const large = { key: "120 ml", variantId: 2 };

describe("photosForVariant", () => {
  it("shows only the size's own photo when it has one", () => {
    expect(photosForVariant([general, small, large], 2)).toEqual([large]);
  });

  it("falls back to a photo without a size", () => {
    expect(photosForVariant([small, general], 2)).toEqual([general]);
  });

  it("shows another size's photo rather than nothing", () => {
    expect(photosForVariant([small, { key: "240 ml", variantId: 3 }], 2)).toEqual([small]);
  });
});

describe("cardPhoto", () => {
  const sizes = [{ id: 1 }, { id: 2 }];

  it("takes the first size's photo, even when it was added later", () => {
    expect(cardPhoto([large, small], sizes)).toBe(small);
  });

  it("takes the next size when the first has none", () => {
    expect(cardPhoto([general, large], sizes)).toBe(large);
  });

  it("takes the first photo when no size has one", () => {
    expect(cardPhoto([general], sizes)).toBe(general);
    expect(cardPhoto([], sizes)).toBeUndefined();
  });
});
