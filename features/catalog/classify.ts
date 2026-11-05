import { slugify } from "@/lib/slug";
import { markerColour } from "./marker-colours";

/** Category tree of the shop. Sort order follows this list. First matching rule wins, so specific rules come first. */
const RULES: readonly (readonly [RegExp, string, string])[] = [
  [/^akrilni-set/, "Boje", "Setovi boja"],
  [/^akrilna-boja-florescentna/, "Boje", "Florescentne boje"],
  [/^akrilna-metalik|^akrilna-boja-multi-titanium/, "Boje", "Metalik boje"],
  [/^akrilna-boja/, "Boje", "Akrilne boje"],
  [/^uljana-boja/, "Boje", "Uljane boje"],
  [/^boja-za-tkaninu/, "Boje", "Boje za tkaninu"],
  [/^boja-za-kozu/, "Boje", "Boje za kožu"],
  [/^boja-za-namjestaj/, "Boje", "Boje za namještaj"],
  [/^boja-za-tackanje/, "Boje", "Boje za tačkanje"],
  [/^ebru/, "Boje", "Ebru boje"],

  [/metalik-marker/, "Markeri", "Metalik markeri"],
  [/marker/, "Markeri", "Akrilni markeri"],

  [/^folija|pasta-za-foliju|ljepilo-za-foliju/, "Pozlata i folije", "Folije"],
  [/^listici|ljepilo-za-listice|za-pozlatu/, "Pozlata i folije", "Pozlata"],

  [/quick-crackle|efekat-pucanja/, "Efekti", "Efekat pucanja"],
  [/pasta/, "Efekti", "Reljefne i teksturne paste"],
  [/^sprej-efekat/, "Efekti", "Sprejevi s efektom"],
  [/^patina|^vosak/, "Efekti", "Patina i vosak"],
  [/^magicni-puder/, "Efekti", "Puderi"],

  [/^crystal-resin|kristalna-glazura|slojni-lak/, "Smola i pigmenti", "Smola i glazure"],
  [/^pigment/, "Smola i pigmenti", "Pigmenti"],

  [/^prajmer|gesso/, "Podloge, lakovi i mediji", "Podloge"],
  [/^lak-/, "Podloge, lakovi i mediji", "Lakovi"],
  [/^medium|^aplikator/, "Podloge, lakovi i mediji", "Mediji"],
  [/^laneno-ulje|^terpentin|^tecnost-za-ciscenje/, "Podloge, lakovi i mediji", "Ulja i razrjeđivači"],

  [/^ljepilo/, "Dekupaž i šabloni", "Ljepila"],
  [/^rizin-papir/, "Dekupaž i šabloni", "Rižin papir"],
  [/^sablon/, "Dekupaž i šabloni", "Šabloni"],

  [/^set-kistova/, "Kistovi i alati", "Setovi kistova"],
  [/spuzvast/, "Kistovi i alati", "Spužvasti kistovi i valjci"],
  [/^kist/, "Kistovi i alati", "Kistovi"],
  [/^paleta/, "Kistovi i alati", "Palete"],
  [/spatul|alat|^nozic|^set-za-tackanje/, "Kistovi i alati", "Alati"],
];

export const FALLBACK_CATEGORY = { top: "Ostalo", sub: null } as const;

/**
 * The design's colours plus Višebojne and four metal colours, which the sheet has many of. Checked in order: metals first, because
 * "Cinober Bakar" is copper, and "Sivoplava" is blue, not grey. "Golden Yellow - Zlatnožuta" stays yellow.
 * Metalik is a finish, not a colour: "Akrilna metalik boja - Red" is red.
 */
const FAMILIES: readonly (readonly [string, RegExp])[] = [
  ["visebojne", /\bmix\b/],
  ["zlatne", /\bgold\b|zlat(na|no|o|a)\b/],
  ["srebrne", /silver|srebr|platin/],
  ["bronza-bakar", /bronz|copper|bakar/],
  ["biserne", /pearl|biser/],
  ["ljubicaste", /ljubic|lila|lavand|purple|violet|amethyst|dioxazine|borovnic|blackberry|sljiv|plum/],
  ["plave", /plav|blue|nafta|naptha|tirkiz|turquoise|akva|aqua|cyan|indigo|ultramarine|cerulean|petrol/],
  ["zelene", /zelen|green|smaragd|emerald|patina|lipa|linden|maslin|olive|mint|viridian/],
  ["zute", /zut|yellow|krizantem|chrysant|limun|lemon|gamboge|senf|mustard|safran|saffron/],
  ["narandzaste", /narand|orange|breskv|peach|koral|coral/],
  [
    "crvene",
    /crven|red\b|bordo|bordeaux|roza|rose|pink|crimson|cinober|vermilion|magenta|carmine|malin|visnj|sour-cherry|fuksij|fuchsia|bugenvilij/,
  ],
  [
    "zemljane",
    /smedj|brown|terakot|terracotta|karamel|caramel|camel|moka|mocha|okra|oker|ochre|umber|umbra|sienna|sijena|bez\b|beige|krem(?!.*bijel)|taffy|cokolad|buff|sardon|crijep|\\btile\\b|kesten|chestnut|konjak|cognac|mahagonij|pijesak|asfalt|kasmir|cashmere|boja-koze|skin-tone|flesh/,
  ],
  [
    "bijele-crne",
    /bijel|white|crn|black|siv|grey|gray|ivory|gardenij|gardenia|ljiljan|lilium|antracit|anthracite|kamen|pebble/,
  ],
];

/** Where a colour in the name means the product's colour: "Paleta Black" is a tool, not a black paint. */
const COLOURED = new Set([
  "Boje",
  "Smola i pigmenti",
  "Efekti",
  "Pozlata i folije",
  "Podloge, lakovi i mediji",
]);

/** The part of the name after the line: "Boja za namještaj - White - Bijela", "Uljana boja Art-X, Gold". */
function colourOf(name: string): string {
  const match = name.match(/ - |, /);
  return match?.index === undefined ? "" : slugify(name.slice(match.index));
}

/** True when the name states a colour ("Line - English - Bosnian") or the product is a paint. These need a family. */
/** Families for filters and the admin, in display order. */
export { COLOUR_FAMILIES } from "@/lib/colour-families";

export function namesColour(name: string, top: string): boolean {
  return top === "Boje" || / - .+ - /.test(name);
}

export type Classified = {
  top: string;
  sub: string | null;
  /** Position in the tree, for sorting. */
  sort: number;
  medium: "akril" | "ulje" | null;
  colourFamily: string | null;
};

/** Everything the supplier's product name tells us. Staff can correct any of it in the admin later. */
export function classifyProduct(name: string): Classified {
  const slug = slugify(name);
  const index = RULES.findIndex(([pattern]) => pattern.test(slug));
  const rule = RULES[index];
  const colourPart = COLOURED.has(rule?.[1] ?? "") ? colourOf(name) : "";
  // A set holds several colours, whatever else its name says.
  const isSet = rule?.[2] === "Setovi boja";
  return {
    top: rule?.[1] ?? FALLBACK_CATEGORY.top,
    sub: rule?.[2] ?? FALLBACK_CATEGORY.sub,
    sort: index === -1 ? RULES.length : index,
    medium: /^(akrilna|akrilni)/.test(slug) ? "akril" : /^uljana/.test(slug) ? "ulje" : null,
    colourFamily: isSet
      ? "visebojne"
      : (markerColour(name)?.family ?? FAMILIES.find(([, p]) => p.test(colourPart))?.[0] ?? null),
  };
}
