"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { FIELD_CLASS, INLINE_FIELD_CLASS } from "@/components/atoms/Field";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/cn";
import { useAdminAction } from "@/lib/use-admin-action";
import {
  addLine,
  addManufacturer,
  editLine,
  editManufacturer,
  removeLine,
  removeManufacturer,
} from "../actions";
import type { ManufacturerNode } from "../manufacturers";

type Run = ReturnType<typeof useAdminAction>["run"];

function Row(props: {
  name: string;
  products: number;
  isTop?: boolean;
  /** Why it can't be deleted yet, if it can't */
  blocked: string | null;
  onRename: (name: string) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const t = useTranslations("manufacturers");
  const c = useTranslations("common");
  const [text, setText] = useState(props.name);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <input
        aria-label={c("name")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== props.name) props.onRename(text);
        }}
        className={cn(INLINE_FIELD_CLASS, "min-w-[160px]", props.isTop && "font-semibold")}
      />
      <span className="w-16 text-right text-xs text-[var(--text-muted)]">
        {t("products", { count: props.products })}
      </span>
      <Button
        variant="icon"
        className="ml-2"
        aria-label={c("delete")}
        title={props.blocked ?? c("delete")}
        disabled={props.pending || props.blocked !== null}
        onClick={() => {
          if (window.confirm(c("confirmDelete"))) props.onDelete();
        }}
      >
        <Icon name="trash" size={16} />
      </Button>
    </div>
  );
}

function AddForm({
  label,
  onAdd,
  pending,
}: {
  label: string;
  onAdd: (name: string, done: () => void) => void;
  pending: boolean;
}) {
  const c = useTranslations("common");
  const [name, setName] = useState("");
  return (
    <form
      className="flex max-w-md gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(name, () => setName(""));
      }}
    >
      <input
        aria-label={label}
        placeholder={label}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={FIELD_CLASS}
      />
      <Button type="submit" disabled={pending || !name.trim()}>
        {c("add")}
      </Button>
    </form>
  );
}

function ManufacturerCard({ maker, run, pending }: { maker: ManufacturerNode; run: Run; pending: boolean }) {
  const t = useTranslations("manufacturers");
  return (
    <li className="border border-[var(--border-subtle)] p-3">
      <Row
        name={maker.name}
        products={maker.products}
        isTop
        blocked={maker.products > 0 || maker.lines.length > 0 ? t("deleteBlocked") : null}
        pending={pending}
        onRename={(name) => run(() => editManufacturer({ id: maker.id, name }))}
        onDelete={() => run(() => removeManufacturer({ id: maker.id }))}
      />
      <ul className="mt-1 ml-2 border-l border-[var(--border-subtle)] pl-3">
        {maker.lines.map((line) => (
          <li
            key={`${line.id}-${line.name}`}
            className="border-b border-[var(--border-subtle)] last:border-b-0"
          >
            <Row
              name={line.name}
              products={line.products}
              blocked={line.products > 0 ? t("deleteBlocked") : null}
              pending={pending}
              onRename={(name) => run(() => editLine({ id: line.id, name }))}
              onDelete={() => run(() => removeLine({ id: line.id }))}
            />
          </li>
        ))}
        <li className="mt-2">
          <AddForm
            label={t("newLine")}
            pending={pending}
            onAdd={(name, done) => run(() => addLine({ manufacturerId: maker.id, name }), done)}
          />
        </li>
      </ul>
    </li>
  );
}

export function ManufacturerManager({ manufacturers }: { manufacturers: ManufacturerNode[] }) {
  const t = useTranslations("manufacturers");
  const { run, pending, error } = useAdminAction();
  return (
    <>
      <div aria-live="polite" className="mb-3 min-h-5">
        {error && <Caption tone="error">{error}</Caption>}
      </div>
      <ul className="flex flex-col gap-3">
        {manufacturers.map((m) => (
          <ManufacturerCard key={`${m.id}-${m.name}`} maker={m} run={run} pending={pending} />
        ))}
      </ul>
      <div className="mt-6">
        <AddForm
          label={t("new")}
          pending={pending}
          onAdd={(name, done) => run(() => addManufacturer({ name }), done)}
        />
      </div>
    </>
  );
}
