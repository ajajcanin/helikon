/** Turns one name from the supplier sheet into product and size: "Akrilna boja - Grey Blue - Sivoplava, 120ml". */

const AMOUNT = "\\d+(?:[.,]\\d+)?";
// "50x70 cm", "6x60 ml", "10.8 cm x 120 m"
const DIMENSIONS = new RegExp(
  `[,\\s]+(${AMOUNT})\\s?(cm|mm|m)?\\s?[x×]\\s?(${AMOUNT})\\s?(ml|g|cm|mm|m)\\.?\\s*$`,
  "i",
);
// "120+60 ml", "1000 + 500 ml": two parts sold together
const COMBO = /[,\s]+(\d+)\s?\+\s?(\d+)\s?(ml|gr|g)\.?\s*$/i;
// "120ml", "37 ml"
const AMOUNT_ONLY = new RegExp(`[,\\s]+(${AMOUNT})\\s?(ml|kg|gr|g|l|cm|mm|m)\\.?\\s*$`, "i");

export type ParsedName = {
  /** "Akrilna boja" */
  line: string;
  /** "Akrilna boja - Grey Blue - Sivoplava" */
  product: string;
  /** "120 ml", or null when the name has no size at the end */
  size: string | null;
};

export function parseSheetName(raw: string): ParsedName {
  const name = raw.replace(/\s+/g, " ").trim();
  const combo = name.match(COMBO);
  const dimensions = combo ? null : name.match(DIMENSIONS);
  const amount = combo || dimensions ? null : name.match(AMOUNT_ONLY);
  const cut = (combo ?? dimensions ?? amount)?.index;
  // Some names in the sheet end in a stray " -".
  const product = (cut === undefined ? name : name.slice(0, cut)).replace(/[\s,-]+$/, "").trim();
  let size: string | null = null;
  if (combo) {
    size = `${combo[1]}+${combo[2]} ${combo[3]!.toLowerCase()}`;
  } else if (dimensions) {
    const [, a, firstUnit, b, unit] = dimensions;
    size = firstUnit
      ? `${a} ${firstUnit.toLowerCase()} x ${b} ${unit!.toLowerCase()}`
      : `${a}x${b} ${unit!.toLowerCase()}`;
  } else if (amount) {
    size = `${amount[1]} ${amount[2]!.toLowerCase()}`;
  }
  const line = product.split(/ - |,/)[0]!.trim();
  return { line, product, size };
}

/** "13,3" and "1.234,50" from the sheet as a plain decimal string; null when empty or not a number. */
export function parseSheetNumber(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return String(value);
  const text = String(value).trim().replace(/\./g, "").replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(text) ? text : null;
}

/** A cell's plain value: the sheet stores most text as rich text, and some values as formulas. */
export function cellValue(value: unknown): unknown {
  if (value && typeof value === "object") {
    if ("richText" in value) return (value.richText as { text: string }[]).map((part) => part.text).join("");
    if ("result" in value) return value.result;
  }
  return value;
}
