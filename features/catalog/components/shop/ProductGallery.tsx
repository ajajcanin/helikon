"use client";

import { ProductImage } from "@/components/atoms/ProductImage";
import { photosForVariant } from "@/lib/product-photos";
import { useSelectedVariant } from "@/lib/selected-variant";

type Photo = {
  storageKey: string;
  alt: string;
  width: number;
  height: number;
  variantId: number | null;
};

/** The product's photos, following the chosen size. The first one is shown large. */
export function ProductGallery({ photos }: { photos: Photo[] }) {
  const { selectedId } = useSelectedVariant();
  return (
    <div className="grid grid-cols-2 gap-3">
      {photosForVariant(photos, selectedId).map((photo, index) => (
        <ProductImage
          key={photo.storageKey}
          storageKey={photo.storageKey}
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
          priority={index === 0}
          className={`aspect-square w-full border border-[var(--border-subtle)] ${index === 0 ? "col-span-2" : ""}`}
        />
      ))}
    </div>
  );
}
