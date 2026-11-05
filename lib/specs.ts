/** A product's specifications as lines of "Label: value". */
export function specsToText(specs: unknown): string {
  if (!Array.isArray(specs)) return "";
  return (specs as { label: string; value: string }[]).map((s) => `${s.label}: ${s.value}`).join("\n");
}
