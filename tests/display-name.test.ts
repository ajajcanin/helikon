import { describe, expect, it } from "vitest";
import { displayName } from "@/lib/colour-swatch";

describe("displayName", () => {
  it("names a colour in a line by its colour", () => {
    expect(
      displayName({ name: "Akrilna boja - Powder Pink - Puder roza", colourName: "Puder Roza", lineId: 1 }),
    ).toBe("Puder Roza");
  });

  it("names a product without a line in full, even with a colour", () => {
    expect(displayName({ name: "Ljepilo za foliju", colourName: "Transparent", lineId: null })).toBe(
      "Ljepilo za foliju",
    );
    expect(displayName({ name: "Vosak - Gold - Zlatna", colourName: "Zlatna", lineId: null })).toBe(
      "Vosak - Gold - Zlatna",
    );
  });
});
