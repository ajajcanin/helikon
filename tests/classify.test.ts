import { describe, expect, it } from "vitest";
import { classifyProduct } from "@/features/catalog/classify";

describe("classifyProduct", () => {
  it.each([
    ["Akrilna boja - Grey Blue - Sivoplava", "Boje", "Akrilne boje", "akril", "plave"],
    ["Akrilna boja florescentna - Green - Zelena", "Boje", "Florescentne boje", "akril", "zelene"],
    ["Uljana boja Art-X, Alizarin Crimson", "Boje", "Uljane boje", "ulje", "crvene"],
    ["Boja za namještaj - White - Bijela", "Boje", "Boje za namještaj", null, "bijele-crne"],
    ["Pigment za epoxy - Black - Crna", "Smola i pigmenti", "Pigmenti", null, "bijele-crne"],
    ["Akrilna boja - Blackberry - Borovnica", "Boje", "Akrilne boje", "akril", "ljubicaste"],
    ["Akrilna boja - Cream White - Krem Bijela", "Boje", "Akrilne boje", "akril", "bijele-crne"],
    ["Akrilna metalik boja - Antique Gold - Antik Zlatna", "Boje", "Metalik boje", "akril", "zlatne"],
    ["Akrilna metalik boja - Red - Crvena", "Boje", "Metalik boje", "akril", "crvene"],
    [
      "Akrilna metalik boja - Vermilion Copper - Cinober Bakar",
      "Boje",
      "Metalik boje",
      "akril",
      "bronza-bakar",
    ],
    ["Akrilna metalik boja - Platinum - Platina", "Boje", "Metalik boje", "akril", "srebrne"],
    ["Akrilna metalik boja - Pearl - Biserna", "Boje", "Metalik boje", "akril", "biserne"],
    ["Akrilna boja - Golden Yellow - Zlatnožuta", "Boje", "Akrilne boje", "akril", "zute"],
    ["Uljana boja Art-X, Buff Titanium", "Boje", "Uljane boje", "ulje", "zemljane"],
    ["Uljana boja Art-X, Silver", "Boje", "Uljane boje", "ulje", "srebrne"],
    ["Pigment puder biserni - Black - Crna", "Smola i pigmenti", "Pigmenti", null, "bijele-crne"],
    ["Folija u rolni - Bronze - Bronza", "Pozlata i folije", "Folije", null, "bronza-bakar"],
    ["Akrilni set boja metalik MASTERMIX", "Boje", "Setovi boja", "akril", "visebojne"],
    ["Listići za pozlatu - Mix", "Pozlata i folije", "Pozlata", null, "visebojne"],
    ["Folija u rolni - Emerald - Smaragdna", "Pozlata i folije", "Folije", null, "zelene"],
    ["Prajmer Gesso - White- Bijela", "Podloge, lakovi i mediji", "Podloge", null, "bijele-crne"],
    ["Akrilna boja - Gardenia - Gardenija", "Boje", "Akrilne boje", "akril", "bijele-crne"],
    ["Akrilna boja - Chrysantemum - Krizantema", "Boje", "Akrilne boje", "akril", "zute"],
    ["Lak za efekat pucanja", "Efekti", "Efekat pucanja", null, null],
    ["Pasta za foliju, reljefna", "Pozlata i folije", "Folije", null, null],
    ["Teksturna Krom Pasta - Bronze - Bronza", "Efekti", "Reljefne i teksturne paste", null, "bronza-bakar"],
    ["Lak mat", "Podloge, lakovi i mediji", "Lakovi", null, null],
    ["Paleta Black - Crna", "Kistovi i alati", "Palete", null, null],
    ["Set kistova No.1 - 7 kom", "Kistovi i alati", "Setovi kistova", null, null],
  ])("%s", (name, top, sub, medium, colourFamily) => {
    expect(classifyProduct(name)).toMatchObject({ top, sub, medium, colourFamily });
  });

  it("puts unknown names in Ostalo instead of guessing", () => {
    expect(classifyProduct("Nešto sasvim novo")).toMatchObject({ top: "Ostalo", sub: null });
  });
});
