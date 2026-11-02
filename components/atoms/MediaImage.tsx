"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { MEDIA_PLACEHOLDER, mediaSrcSet, mediaUrl } from "@/lib/media";

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
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const failed = failedKey === storageKey;
  const image = useRef<HTMLImageElement>(null);

  // A failure before the page became interactive never reaches onError.
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth === 0) setFailedKey(storageKey);
  }, [storageKey]);

  return (
    // biome-ignore lint/performance/noImgElement: its sizes are generated at upload, so next/image would only add cost
    <img
      ref={image}
      src={failed ? MEDIA_PLACEHOLDER : mediaUrl(storageKey, width, 640)}
      srcSet={failed ? undefined : mediaSrcSet(storageKey, width)}
      onError={() => setFailedKey(storageKey)}
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
