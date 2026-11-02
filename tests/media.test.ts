import { afterEach, describe, expect, it, vi } from "vitest";
import { MEDIA_PLACEHOLDER, mediaSrcSet, mediaUrl } from "@/lib/media";

afterEach(() => vi.unstubAllEnvs());

describe("media addresses", () => {
  it("point at storage when it's set up", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_URL", "https://media.example");
    expect(mediaUrl("articles/a", 1600, 640)).toBe("https://media.example/articles/a/640.webp");
    expect(mediaSrcSet("articles/a", 640)).toBe(
      "https://media.example/articles/a/320.webp 320w, https://media.example/articles/a/640.webp 640w",
    );
  });

  it("fall back to the placeholder when it isn't", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_URL", "");
    expect(mediaUrl("articles/a", 1600, 640)).toBe(MEDIA_PLACEHOLDER);
    expect(mediaSrcSet("articles/a", 1600)).toBeUndefined();
  });
});
