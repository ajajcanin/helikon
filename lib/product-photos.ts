type SizedPhoto = { variantId: number | null };

/**
 * The photos to show for a chosen size: its own. A size without any shows the product's photos that have no size,
 * or else one photo of another size.
 */
export function photosForVariant<P extends SizedPhoto>(photos: P[], variantId?: number) {
  const own = photos.filter((p) => p.variantId === variantId);
  if (own.length > 0) return own;
  const general = photos.filter((p) => p.variantId === null);
  return general.length > 0 ? general : photos.slice(0, 1);
}

/** The photo for product cards and search: the first size's, or the next size that has one. */
export function cardPhoto<P extends SizedPhoto>(photos: P[], variants: { id: number }[]) {
  for (const variant of variants) {
    const own = photos.find((p) => p.variantId === variant.id);
    if (own) return own;
  }
  return photos[0];
}
