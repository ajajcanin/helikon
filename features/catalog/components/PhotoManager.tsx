"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { Icon } from "@/components/atoms/Icon";
import { ProductImage } from "@/components/atoms/ProductImage";
import { uploadImage } from "@/lib/upload-image";
import { useAdminAction } from "@/lib/use-admin-action";
import { finishProductPhoto, removePhoto, reorderPhoto, requestProductPhoto } from "../actions";
import type { AdminPhoto } from "../photos";

function PhotoRow({ photo, isFirst, isLast }: { photo: AdminPhoto; isFirst: boolean; isLast: boolean }) {
  const c = useTranslations("common");
  const { run, pending, error } = useAdminAction();
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-[var(--border-subtle)] py-2">
      <ProductImage
        storageKey={photo.storageKey}
        width={photo.width}
        height={photo.height}
        alt=""
        sizes="64px"
        className="h-16 w-16"
      />
      <div className="flex items-center">
        <Button
          variant="icon"
          aria-label={c("moveUp")}
          title={c("moveUp")}
          disabled={pending || isFirst}
          onClick={() => run(() => reorderPhoto({ id: photo.id, direction: "up" }))}
        >
          <Icon name="up" size={16} />
        </Button>
        <Button
          variant="icon"
          aria-label={c("moveDown")}
          title={c("moveDown")}
          disabled={pending || isLast}
          onClick={() => run(() => reorderPhoto({ id: photo.id, direction: "down" }))}
        >
          <Icon name="down" size={16} />
        </Button>
        <Button
          variant="icon"
          aria-label={c("delete")}
          title={c("delete")}
          disabled={pending}
          onClick={() => {
            if (window.confirm(c("confirmDelete"))) run(() => removePhoto({ id: photo.id }));
          }}
        >
          <Icon name="trash" size={16} />
        </Button>
      </div>
      {error && <Caption tone="error">{error}</Caption>}
    </li>
  );
}

/** Photos that show together: one size's, the ones for every size, or all of them on a product with one size. */
function PhotoGroup({
  productId,
  variantId,
  title,
  empty,
  addLabel,
  photos,
}: {
  productId: number;
  variantId?: number;
  title?: string;
  empty?: string;
  /** Without it the group can't take new photos. */
  addLabel?: string;
  photos: AdminPhoto[];
}) {
  const t = useTranslations("photos");
  const { run } = useAdminAction();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    start(async () => {
      for (const file of Array.from(files)) {
        const res = await uploadImage(file, {
          request: requestProductPhoto,
          finish: (key) => finishProductPhoto({ productId, key, variantId }),
        });
        if ("error" in res) {
          setError(`${file.name}: ${res.error}`);
          break;
        }
      }
      if (input.current) input.current.value = "";
      run(async () => ({ ok: true }));
    });
  }

  return (
    <div className="mb-4 last:mb-0">
      {title && <h3 className="mb-2 font-ui text-sm text-[var(--text-secondary)]">{title}</h3>}
      {photos.length > 0 ? (
        <ul className="mb-3 border-t border-[var(--border-subtle)]">
          {photos.map((photo, index) => (
            <PhotoRow
              key={photo.id}
              photo={photo}
              isFirst={index === 0}
              isLast={index === photos.length - 1}
            />
          ))}
        </ul>
      ) : (
        empty && <p className="mb-2 font-ui text-xs text-[var(--text-muted)]">{empty}</p>
      )}
      {addLabel && (
        <>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            aria-label={title ? `${addLabel}: ${title}` : addLabel}
            onChange={(e) => upload(e.target.files)}
          />
          <Button disabled={pending} onClick={() => input.current?.click()}>
            {pending ? t("uploading") : addLabel}
          </Button>
          <div aria-live="polite" className="mt-2">
            {error && <Caption tone="error">{error}</Caption>}
          </div>
        </>
      )}
    </div>
  );
}

export function PhotoManager({
  productId,
  photos,
  sizes,
}: {
  productId: number;
  photos: AdminPhoto[];
  sizes: { id: number; size: string }[];
}) {
  const t = useTranslations("photos");
  const bySize = sizes.length > 1;
  // A photo without a size still needs a place to be managed, so it sits under the first size.
  const unlinked = photos.filter((p) => !sizes.some((s) => s.id === p.variantId));
  return (
    <section className="mb-4 border border-[var(--border-subtle)] p-4">
      <h2 className="mb-1 font-display text-base tracking-[0.04em]">{t("title")}</h2>
      <p className="mb-3 font-ui text-xs text-[var(--text-muted)]">
        {t("hint")}
        {bySize && ` ${t("sizeHint")}`}
      </p>
      {bySize ? (
        <>
          {sizes.map((s, index) => (
            <PhotoGroup
              key={s.id}
              productId={productId}
              variantId={s.id}
              title={s.size}
              empty={t("none")}
              addLabel={t("addOne")}
              photos={[...photos.filter((p) => p.variantId === s.id), ...(index === 0 ? unlinked : [])]}
            />
          ))}
        </>
      ) : (
        <PhotoGroup productId={productId} addLabel={t("add")} photos={photos} />
      )}
    </section>
  );
}
