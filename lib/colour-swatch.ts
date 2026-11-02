/** A representative colour per family until real photos exist. Yellow to earth tones are the design's own. */
const SWATCHES: Record<string, string> = {
  zute: "#E8B814",
  narandzaste: "#E2692A",
  crvene: "#A93226",
  ljubicaste: "#7A3B6B",
  plave: "#1F3A93",
  zelene: "#2F6B4A",
  zemljane: "#7A4A21",
  "bijele-crne": "#DDDDD5",
  zlatne: "#C6A24B",
  srebrne: "#B8B8B4",
  "bronza-bakar": "#A0623A",
  biserne: "#E6DFD0",
  visebojne: "#8A5A6B",
};

export const swatchColour = (family: string | null) => (family ? (SWATCHES[family] ?? null) : null);

/** What a customer calls the product: its colour when it has one. */
export const displayName = (p: {
  name: string;
  colourName?: string | null;
  colourNameMaker?: string | null;
}) => p.colourName ?? p.colourNameMaker ?? p.name;
