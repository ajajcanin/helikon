import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Rules Biome can't express. Haen documents the first one but doesn't enforce it, and breaks it 25 times. */
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

describe("architecture", () => {
  it("features never import other features", () => {
    const bad: string[] = [];
    for (const file of files("features")) {
      const own = file.split(path.sep)[1];
      for (const m of readFileSync(file, "utf8").matchAll(/from "@\/features\/([^/"]+)/g)) {
        if (m[1] !== own) bad.push(`${file} → ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("public queries never touch purchase data", () => {
    for (const file of files("server/public")) {
      const code = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*/g, "");
      expect(code).not.toMatch(
        /variantCost|variant_cost|cost:\s*(true|\{)|purchase|margin:|reviewNote|confirmedBy/i,
      );
    }
  });

  it("client components never import server code", () => {
    const bad: string[] = [];
    for (const file of [...files("features"), ...files("components")]) {
      const text = readFileSync(file, "utf8");
      const typeOnly = /import type [^;]+"@\/server\//;
      if (
        /^["']use client["']/.test(text) &&
        /from "@\/server\//.test(text.replace(new RegExp(typeOnly, "g"), ""))
      ) {
        bad.push(file);
      }
    }
    expect(bad).toEqual([]);
  });
});
