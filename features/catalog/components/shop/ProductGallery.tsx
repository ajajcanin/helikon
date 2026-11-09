"use client";

import { useTranslations } from "next-intl";
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

/**
 * The product's photos, following the chosen size. The first one is shown large.
 * A motif shows only its own photo: another motif's would show the wrong picture.
 */
export function ProductGallery({ photos, motifs }: { photos: Photo[]; motifs?: boolean }) {
  const { selectedId } = useSelectedVariant();
  const t = useTranslations("shop");
  const shown = motifs
    ? photos.filter((p) => p.variantId === selectedId)
    : photosForVariant(photos, selectedId);
  if (shown.length === 0)
    return (
      <div className="flex aspect-square items-center justify-center border border-[var(--border-subtle)] bg-[var(--product-tile)] p-6 text-center font-ui text-sm text-neutral-600">
        {t("motifNoPhoto")}
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-3">
      {shown.map((photo, index) => (
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
