import { describe, expect, it } from "vitest";
import { matchMotifFiles, motifName } from "@/lib/motif-files";

describe("matchMotifFiles", () => {
  const skus = ["2801", "2802", "2810"];

  it("pairs files with motifs by the šifra at the start of their name", () => {
    const files = [{ name: "2801.jpg" }, { name: "2810 lavanda.PNG" }, { name: "2802_v2.webp" }];
    const { matched, unmatched } = matchMotifFiles(files, skus);
    expect(matched.map((m) => m.sku)).toEqual(["2801", "2810", "2802"]);
    expect(unmatched).toEqual([]);
  });

  it("keeps files that name no motif apart", () => {
    const { matched, unmatched } = matchMotifFiles([{ name: "IMG_0001.jpg" }, { name: "28011.jpg" }], skus);
    expect(matched).toEqual([]);
    expect(unmatched.map((f) => f.name)).toEqual(["IMG_0001.jpg", "28011.jpg"]);
  });
});

describe("motifName", () => {
  it("takes the maker's number, or the name after Rice paper", () => {
    expect(motifName("RICE PAPER 8027")).toBe("8027");
    expect(motifName("GOLD RICE PAPER WHITE-GOLD 72002")).toBe("72002");
    expect(motifName("Rice paper Sarajevo Vintage II")).toBe("Sarajevo Vintage II");
    expect(motifName("Rice Paper Gradovi")).toBe("Gradovi");
  });
});
