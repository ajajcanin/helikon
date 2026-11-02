import { cn } from "@/lib/cn";
import { mediaSrcSet, mediaUrl } from "@/lib/media";

type Props = {
  storageKey: string;
  width: number;
  height?: number | null;
  alt: string;
  /** How wide it shows, so the browser picks the right size, e.g. "(max-width: 768px) 50vw, 25vw" */
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** An uploaded image, already resized at upload and served from object storage. */
export function MediaImage({ storageKey, width, height, alt, sizes, priority, className }: Props) {
  return (
    // biome-ignore lint/performance/noImgElement: its sizes are generated at upload, so next/image would only add cost
    <img
      src={mediaUrl(storageKey, width, 640)}
      srcSet={mediaSrcSet(storageKey, width)}
      sizes={sizes}
      width={width}
      height={height ?? undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("block", className)}
    />
  );
}
