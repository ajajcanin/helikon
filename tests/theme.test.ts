import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("styles/globals.css", "utf8");

function tokens(selector: string) {
  const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0]!;
  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1]!, m[2]!]),
  );
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("light admin theme", () => {
  const t = tokens('[data-theme="light"]');

  it.each([
    ["text-display", "bg-page"],
    ["text-secondary", "bg-page"],
    ["text-muted", "bg-page"],
    ["text-display", "bg-well"],
    ["text-muted", "bg-well"],
    ["accent-bright", "bg-page"],
    ["error", "bg-page"],
    ["text-on-accent", "accent"],
    ["text-on-accent", "accent-bright"],
    ["text-on-accent", "accent-active"],
  ])("%s on %s is readable (WCAG AA)", (text, background) => {
    expect(contrast(t[text]!, t[background]!)).toBeGreaterThanOrEqual(4.5);
  });

  it("field borders are visible (3:1)", () => {
    expect(contrast(t["border-strong"]!, t["bg-page"]!)).toBeGreaterThanOrEqual(3);
  });
});
