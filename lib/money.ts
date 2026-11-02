/**
 * "1.234,50 KM". Written out by hand because browsers don't all carry Bosnian number formats: Chrome falls back to
 * "BAM 1,234.50" while the server prints "1.234,50 KM", so the same price could read differently on one page.
 */
export function km(value: number | string): string {
  const [whole = "0", cents = "00"] = Math.abs(Number(value)).toFixed(2).split(".");
  const sign = Number(value) < 0 ? "-" : "";
  return `${sign}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cents} KM`;
}
