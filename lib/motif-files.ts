/**
 * Pairs image files with motifs by name: "2801.jpg" or "2801 nešto.png" goes to the motif with šifra 2801.
 * Files that name no motif come back apart, so they can be reported.
 */
export function matchMotifFiles<F extends { name: string }>(files: F[], skus: string[]) {
  const matched: { file: F; sku: string }[] = [];
  const unmatched: F[] = [];
  for (const file of files) {
    const code =
      file.name
        .replace(/\.[^.]+$/, "")
        .trim()
        .split(/[\s_-]/)[0] ?? "";
    const sku = skus.find((s) => s === code);
    if (sku) matched.push({ file, sku });
    else unmatched.push(file);
  }
  return { matched, unmatched };
}

/**
 * A motif's name from the maker's description: its number at the end ("RICE PAPER 8027" → "8027",
 * "WALL DECOR SERIES 50x70 cm WALL-005" → "005"), or the words after "Rice paper" ("Sarajevo II").
 */
export function motifName(description: string) {
  const text = description.trim();
  const number = text.match(/(\d+)\s*$/);
  if (number) return number[1]!;
  return text.replace(/^rice paper\s+/i, "").trim();
}
