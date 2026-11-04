/** Widths generated once at upload, so Vercel's image optimisation isn't needed. */
export const IMAGE_WIDTHS = [320, 640, 1024, 1600] as const;

/** Sizes stored for an image whose largest size is `width`: the standard ones below it, and its own. */
export function storedWidths(width: number): number[] {
  return [...IMAGE_WIDTHS.filter((w) => w < width), width];
}

/** Shown when storage isn't set up, or an image's file is missing from it. */
export const MEDIA_PLACEHOLDER = "/images/media-placeholder.svg";

export const hasMediaStorage = () => Boolean(process.env.NEXT_PUBLIC_MEDIA_URL);

const url = (key: string, width: number) => `${process.env.NEXT_PUBLIC_MEDIA_URL}/${key}/${width}.webp`;

/** The smallest stored size that is at least `want` wide, or the largest there is. */
export function mediaUrl(key: string, width: number, want: number): string {
  if (!hasMediaStorage()) return MEDIA_PLACEHOLDER;
  const widths = storedWidths(width);
  return url(key, widths.find((w) => w >= want) ?? widths[widths.length - 1] ?? width);
}

export function mediaSrcSet(key: string, width: number): string | undefined {
  if (!hasMediaStorage()) return undefined;
  return storedWidths(width)
    .map((w) => `${url(key, w)} ${w}w`)
    .join(", ");
}
