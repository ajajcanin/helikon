const MAP: Record<string, string> = { č: "c", ć: "c", đ: "dj", š: "s", ž: "z" };

/** URL-safe name: lowercase, Bosnian letters transliterated, everything else becomes a hyphen. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[čćđšž]/g, (c) => MAP[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
