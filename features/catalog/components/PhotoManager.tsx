"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { FIELD_CLASS } from "@/components/atoms/Field";
import { Icon } from "@/components/atoms/Icon";
import { ProductImage } from "@/components/atoms/ProductImage";
import { uploadImage } from "@/lib/upload-image";
import { useAdminAction } from "@/lib/use-admin-action";
import { editPhotoAlt, finishProductPhoto, removePhoto, reorderPhoto, requestProductPhoto } from "../actions";
import type { AdminPhoto } from "../photos";

function PhotoRow({ photo, isFirst, isLast }: { photo: AdminPhoto; isFirst: boolean; isLast: boolean }) {
  const t = useTranslations("photos");
  const c = useTranslations("common");
  const { run, pending, error } = useAdminAction();
  const [alt, setAlt] = useState(photo.alt ?? "");
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
      <input
        aria-label={t("alt")}
        placeholder={t("alt")}
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        onBlur={() => {
          if (alt !== (photo.alt ?? "")) run(() => editPhotoAlt({ id: photo.id, alt }));
        }}
        className={`${FIELD_CLASS} w-auto min-w-[180px] flex-1`}
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

export function PhotoManager({ productId, photos }: { productId: number; photos: AdminPhoto[] }) {
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
          finish: (key) => finishProductPhoto({ productId, key }),
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
    <section className="mb-4 border border-[var(--border-subtle)] p-4">
      <h2 className="mb-1 font-display text-base tracking-[0.04em]">{t("title")}</h2>
      <p className="mb-3 font-ui text-xs text-[var(--text-muted)]">{t("hint")}</p>
      {photos.length > 0 && (
        <ul className="mb-3 border-t border-[var(--border-subtle)]">
          {photos.map((photo, index) => (
            <PhotoRow
              key={`${photo.id}-${photo.alt}`}
              photo={photo}
              isFirst={index === 0}
              isLast={index === photos.length - 1}
            />
          ))}
        </ul>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        aria-label={t("add")}
        onChange={(e) => upload(e.target.files)}
      />
      <Button disabled={pending} onClick={() => input.current?.click()}>
        {pending ? t("uploading") : t("add")}
      </Button>
      <div aria-live="polite" className="mt-2">
        {error && <Caption tone="error">{error}</Caption>}
      </div>
    </section>
  );
}
