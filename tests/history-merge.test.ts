import { describe, expect, it } from "vitest";
import { mergeEdits } from "@/lib/history-merge";

const at = (minutes: number) => new Date(2026, 10, 5, 12, minutes);
const edit = (minutes: number, field: string, from: string, to: string, over = {}) => ({
  at: at(minutes),
  userName: "Ajdin",
  tableName: "product",
  recordId: "60",
  title: "Izmijenjen artikal",
  shown: [{ field, from, to }],
  ...over,
});

describe("mergeEdits", () => {
  it("joins different fields into one row", () => {
    const rows = mergeEdits([edit(5, "finish", "Mat", "Saten"), edit(4, "colourCode", "133", "134")]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.shown.map((c) => c.field)).toEqual(["finish", "colourCode"]);
  });

  it("keeps a field's first and last value", () => {
    const rows = mergeEdits([edit(5, "finish", "Saten", "Sjaj"), edit(4, "finish", "Mat", "Saten")]);
    expect(rows[0]!.shown).toEqual([{ field: "finish", from: "Mat", to: "Sjaj" }]);
  });

  it("starts a new row after 15 minutes", () => {
    expect(mergeEdits([edit(30, "finish", "B", "C"), edit(10, "finish", "A", "B")])).toHaveLength(2);
  });

  it("keeps other people and other products apart", () => {
    const rows = mergeEdits([
      edit(5, "finish", "A", "B"),
      edit(4, "finish", "A", "B", { userName: "Ana" }),
      edit(3, "finish", "A", "B", { recordId: "61" }),
    ]);
    expect(rows).toHaveLength(3);
  });

  it("joins past someone else's edit in between", () => {
    const rows = mergeEdits([
      edit(5, "finish", "B", "C"),
      edit(4, "name", "X", "Y", { recordId: "61" }),
      edit(3, "finish", "A", "B"),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.shown).toEqual([{ field: "finish", from: "A", to: "C" }]);
  });

  it("leaves rows without values alone", () => {
    const photo = { ...edit(5, "x", "", ""), shown: [], title: "Obrisana slika artikla" };
    expect(mergeEdits([photo, { ...photo, at: at(4) }])).toHaveLength(2);
  });
});
