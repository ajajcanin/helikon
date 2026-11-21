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
/**
 * What customers read as the product's name. Within a line its colour says it all ("Puder Roza"), since the line and
 * its other colours are shown with it. Without a line a colour alone would hide what it is ("Zlatna" for a wax), so
 * the full name shows.
 */
export const displayName = (p: {
  name: string;
  colourName?: string | null;
  colourNameMaker?: string | null;
  lineId: number | null;
}) => (p.lineId === null ? p.name : (p.colourName ?? p.colourNameMaker ?? p.name));
