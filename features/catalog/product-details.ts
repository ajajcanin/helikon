import { slugify } from "@/lib/slug";
import { markerColour } from "./marker-colours";

export type Spec = { label: string; value: string };

type Line = {
  match: RegExp;
  manufacturer: string;
  line: string;
  finish?: string;
  description: string;
  specs: readonly (readonly [string, string])[];
  /** Where it comes from, and how sure the match to the sheet is. */
  source: string;
};

const WATER: readonly [string, string] = ["Baza", "Voda"];
const MIX: readonly [string, string] = ["Miješanje", "Boje se mogu međusobno miješati"];
const CATALOGUE = "Rich katalog";

/**
 * Details per product line, translated from Rich's catalogue (richhobby.com/GoldkimCatalogue.pdf). The sheet doesn't name
 * Rich: lines were matched by comparing colour names with catalogue pages, and the client confirms each product.
 * First match wins. Only states what the catalogue says: nothing here is per colour, such as pigments or lightfastness.
 */
const LINES: readonly Line[] = [
  {
    match: /^akrilna-boja-florescentna/,
    manufacturer: "Rich",
    line: "Master Acrylic, florescentne",
    finish: "Florescentna",
    description: "Florescentna akrilna boja na bazi vode, za hobi i umjetničke radove.",
    specs: [WATER, MIX],
    source: `${CATALOGUE}, str. 23. Provjeriti: katalog ovdje ima malo teksta.`,
  },
  {
    match: /^akrilna-boja-multi-titanium/,
    manufacturer: "Rich",
    line: "Multi Titanium Metallic",
    finish: "Metalik, biserna",
    description:
      "Biserna metalik boja na bazi vode za umjetničke, dekorativne i reciklažne projekte te tekstil. Daje metalni sjaj i ne ostavlja tragove kista. Preporučuje se zaštita High Gloss lakom.",
    specs: [
      WATER,
      ["Upotreba", "Unutra i vani"],
      ["Pokrivnost", "2-3 sloja"],
      ["Razrjeđivanje", "Nije potrebno"],
      ["Priprema", "Bez brušenja i prajmera"],
      ["Nanošenje", "Kist i valjak"],
      MIX,
    ],
    source: `${CATALOGUE}, str. 37-39. Svih 5 boja i veličina 90 ml se poklapaju.`,
  },
  {
    match: /^akrilna-metalik/,
    manufacturer: "Rich",
    line: "Metallic Hobby",
    finish: "Metalik",
    description:
      "Metalik hobi boja na bazi vode koja daje nježan sjaj na neobrađenim podlogama, za dekoraciju i umjetničke hobi radove. Preporučuje se zaštita High Gloss lakom.",
    specs: [
      WATER,
      ["Pokrivnost", "2-3 sloja"],
      ["Priprema", "Bez brušenja i prajmera"],
      ["Upotreba", "Spremna za upotrebu"],
      ["Norme", "CE i EN71"],
      MIX,
    ],
    source: `${CATALOGUE}, str. 43. Katalog ima 39 boja, kao i tabela.`,
  },
  {
    match: /^akrilna-boja/,
    manufacturer: "Rich",
    line: "Master Acrylic",
    finish: "Polumat (saten)",
    description:
      "Akrilna boja bez mirisa, na bazi vode, od prvoklasnih pigmenata. Nanosi se bez razrjeđivanja i dobro pokriva. Pogodna za sve neobrađene tvrde podloge.",
    specs: [
      WATER,
      ["Izgled", "Polumat (saten)"],
      ["Razrjeđivanje", "Nije potrebno"],
      ["Nanošenje", "Kist i valjak"],
      ["Podloge", "Neobrađene tvrde podloge"],
      MIX,
    ],
    source: `${CATALOGUE}, str. 19-23. Veličine se poklapaju, a 57 od 153 boje su na najboljoj stranici.`,
  },
  {
    match: /^boja-za-tkaninu/,
    manufacturer: "Rich",
    line: "Fabric Paint",
    description:
      "Boja za tekstil, vrlo elastična i mekana. Iako je na bazi vode, može se prati i ne puca niti se ljušti nakon pranja.",
    specs: [WATER, ["Podloge", "Tekstil"], ["Pranje", "Može se prati"]],
    source: `${CATALOGUE}, str. 57. 20 običnih i 25 metalik boja od 50 ml, kao u tabeli.`,
  },
  {
    match: /^boja-za-kozu/,
    manufacturer: "Rich",
    line: "Selfy Decor Leather Paint",
    finish: "Polumat",
    description:
      "Boja za kožu i umjetnu kožu, prirodnog polumat izgleda. Samolakirajuća je, elastična, ne puca i ne ljušti se, i ne ostavlja tragove kista.",
    specs: [
      WATER,
      ["Podloge", "Koža i umjetna koža"],
      ["Pokrivnost", "2-3 sloja"],
      ["Razrjeđivanje", "Nije potrebno"],
      ["Lak", "Nije potreban"],
      MIX,
    ],
    source: `${CATALOGUE}, str. 29. 18 od 20 boja se poklapa.`,
  },
  {
    match: /^boja-za-namjestaj/,
    manufacturer: "Rich",
    line: "Selfy Decor",
    finish: "Soft mat",
    description:
      "Samolakirajuća dekorativna boja na bazi vode za drvo te lakirani i lazurni namještaj. Površina treba biti čista i suha, bez brušenja.",
    specs: [
      WATER,
      ["Podloge", "Drvo, lakirani namještaj"],
      ["Pokrivnost", "2 sloja"],
      ["Između slojeva", "4-6 sati"],
      ["Razrjeđivanje", "Nije potrebno"],
      ["Nanošenje", "Kist i valjak"],
      MIX,
    ],
    source: `${CATALOGUE}, str. 25-27. 19 od 20 boja se poklapa. Katalog navodi i 6-8 sati između slojeva.`,
  },
  {
    match: /^boja-za-tackanje/,
    manufacturer: "Rich",
    line: "3D Dot Paint",
    description:
      "Boja za najsitnije detalje i 3D dizajn, s iglastim vrhom. Ne razliva se, slojevi se mogu nanositi jedan preko drugog, a nakon sušenja je sjajna.",
    specs: [WATER, ["Izgled nakon sušenja", "Sjajan"], ["Vrh", "Iglasti"]],
    source: `${CATALOGUE}, str. 52-53. Veličina 40 ml i većina boja se poklapaju.`,
  },
  {
    match: /^ebru/,
    manufacturer: "Rich",
    line: "Ebru Paint",
    description: "Ebru boja spremna za upotrebu, živih tonova, u bočici s kapaljkom.",
    specs: [WATER, ["Upotreba", "Spremna za upotrebu"], MIX],
    source: `${CATALOGUE}, str. 191. 13 boja, kao u tabeli.`,
  },
  {
    match: /^quick-crackle/,
    manufacturer: "Rich",
    line: "Quick Crackle",
    finish: "Efekat pucanja",
    description: "Boja za efekat pucanja.",
    specs: [],
    source: `${CATALOGUE}, str. 90-91. Svih 20 boja se poklapa, ali katalog ima malo teksta, pa opis treba dopuniti.`,
  },
  {
    match: /^pigment-za-epoxy/,
    manufacturer: "Rich",
    line: "Epoxy Pigment",
    description: "Koncentrovani pigment za bojenje epoksi smole i opću namjenu. Promućkati prije upotrebe.",
    specs: [["Upotreba", "Bojenje epoksi smole"]],
    source: `${CATALOGUE}, str. 101. Svih 9 boja se poklapa.`,
  },
  {
    match: /^pigment-puder-biserni/,
    manufacturer: "Rich",
    line: "Pearl Pigment",
    finish: "Biserna",
    description: "Biserni pigment u prahu za opću namjenu. Daje metalik izgled, a efekat raste s količinom.",
    specs: [],
    source: `${CATALOGUE}, str. 100. Svih 6 boja se poklapa.`,
  },
  {
    match: /^folija-u-rolni/,
    manufacturer: "Rich",
    line: "Foil Roll",
    finish: "Sjajna",
    description:
      "Imitacija pozlate za hobi, umjetničke radove i dekoraciju. Daje površini blistav izgled. Ne sadrži pravo zlato.",
    specs: [],
    source: `${CATALOGUE}, str. 86. Svih 8 boja se poklapa.`,
  },
  {
    match: /^tecnost-za-pozlatu/,
    manufacturer: "Rich",
    line: "Liquid Foil",
    finish: "Metalik",
    description:
      "Tečni varak spreman za upotrebu, za restauraciju i ukrašavanje, od imitacije praha i sintetičke smole. Nanosi se na kraju projekta. Promućkati prije svake upotrebe.",
    specs: [
      ["Sušenje", "24 sata"],
      ["Pokrivnost", "1 sloj"],
      ["Lak", "Nije potreban"],
      ["Upotreba", "Unutra i vani"],
      MIX,
    ],
    source: `${CATALOGUE}, str. 47-48. 5 boja od 75 ml, kao u tabeli.`,
  },
  {
    match: /^pasta-efekat-rustike/,
    manufacturer: "Rich",
    line: "Rust Effect",
    finish: "Mat",
    description:
      "Gusta boja za oksidirani izgled, poput prirodne rđe. Na zraku postaje mat. Promiješati prije upotrebe i nanositi bez razrjeđivanja špatulom, kistom ili spužvom.",
    specs: [WATER, ["Razrjeđivanje", "Nije potrebno"], ["Nanošenje", "Špatula, kist ili spužva"]],
    source: `${CATALOGUE}, str. 69. Veličina 150 ml se poklapa, ali samo 4 od 7 boja, pa provjeriti.`,
  },
  {
    match: /^teksturna-(vintage|krom)-pasta/,
    manufacturer: "Rich",
    line: "Texture Paste",
    description:
      "Dekorativna pasta sa zrncima različite veličine za tvrde podloge. Ostavlja reljefni efekat i može se ponovo bojiti akrilnim bojama. Promiješati prije upotrebe.",
    specs: [["Podloge", "Tvrde podloge"]],
    source: `${CATALOGUE}, str. 75. Boje i veličina 150 ml se poklapaju.`,
  },
  {
    match: /marker-art-x-duo/,
    manufacturer: "Rich",
    line: "Art-X Acrylic Duo Marker",
    description:
      "Akrilni marker s dva vrha, tankim za detalje i širokim za veće poteze. Boja je živa i brzo se suši.",
    specs: [WATER, ["Vrhovi", "1 mm i 6 mm"], ["Sastav", "Netoksičan"]],
    source: "richhobby.com, stranica proizvoda ART-X Acrylic Duo Marker.",
  },
  {
    match: /metalik-marker-art-x/,
    manufacturer: "Rich",
    line: "Art-X Acrylic Metallic Marker",
    finish: "Metalik",
    description: "Akrilni metalik marker na bazi vode.",
    specs: [WATER, ["Sastav", "Netoksičan"]],
    source: "richhobby.com, stranica proizvoda ART-X Metallic Marker.",
  },
];

/** Rich lines known from the name alone, with no text from the catalogue. */
function lineFromName(slug: string) {
  if (/^uljana-boja-art-x/.test(slug)) return "Art-X Oil Paint";
  if (/mastermix/.test(slug)) return "Mastermix";
  if (/art-x/.test(slug)) return "Art-X";
  return null;
}

/** A colour stated in the name: "Line - English - Bosnian", "Uljana boja Art-X, Gold". */
function colourFromName(name: string) {
  const dashed = name.split(" - ");
  if (dashed.length >= 3) {
    return { maker: dashed[1]!.trim(), name: dashed.slice(2).join(" - ").trim() };
  }
  const oil = name.match(/^Uljana boja Art-X, (.+)$/);
  if (oil) return { maker: oil[1]!.trim(), name: null };
  return { maker: null, name: null };
}

/** Colour families judged from what a name usually looks like, not from the name saying the colour. */
const GUESSED = /krizantem|gardenij|ljiljan|nafta|\blipa\b|patina|kamen\b|sardoniks/i;

export function productDetails(name: string) {
  const slug = slugify(name);
  const line = LINES.find((l) => l.match.test(slug));
  const marker = markerColour(name);
  const colour = marker ?? colourFromName(name);
  const notes = [
    line?.source ?? "Nema podataka proizvođača: dopuniti opis i specifikaciju.",
    marker?.note,
    !marker && GUESSED.test(name) ? "Porodica boje je procjena prema nazivu: provjeriti na boji." : null,
    /^Uljana boja/.test(name) ? "Uljane boje nisu u katalogu proizvođača." : null,
  ];
  const namedLine = lineFromName(slug);
  return {
    manufacturer: line?.manufacturer ?? (namedLine ? "Rich" : null),
    line: line?.line ?? namedLine,
    finish: line?.finish ?? null,
    description: line?.description ?? null,
    specs: line?.specs.map(([label, value]): Spec => ({ label, value })) ?? null,
    colourName: colour.name,
    colourNameMaker: colour.maker,
    colourCode: marker?.code ?? null,
    reviewNote: notes.filter(Boolean).join(" "),
  };
}
