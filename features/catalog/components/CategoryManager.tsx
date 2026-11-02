"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { FIELD_CLASS, INLINE_FIELD_CLASS } from "@/components/atoms/Field";
import { Icon } from "@/components/atoms/Icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { useAdminAction } from "@/lib/use-admin-action";
import {
  addCategory,
  editCategoryName,
  editCategoryOrder,
  editCategoryParent,
  removeCategory,
} from "../actions";
import type { CategoryNode } from "../categories";

type Run = ReturnType<typeof useAdminAction>["run"];

type RowProps = {
  id: number;
  name: string;
  /** Shown next to the name */
  products: number;
  /** Why it can't be deleted yet, if it can't */
  blocked: string | null;
  tops: { id: number; name: string }[];
  parentId: number | null;
  canMove: boolean;
  isFirst: boolean;
  isLast: boolean;
  isTop?: boolean;
  run: Run;
  pending: boolean;
};

function Row({
  id,
  name,
  products,
  blocked,
  tops,
  parentId,
  canMove,
  isFirst,
  isLast,
  isTop,
  run,
  pending,
}: RowProps) {
  const t = useTranslations("categories");
  const c = useTranslations("common");
  const [text, setText] = useState(name);
  const [moving, setMoving] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <input
        aria-label={c("name")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== name) run(() => editCategoryName({ id, name: text }));
        }}
        className={cn(INLINE_FIELD_CLASS, "min-w-[160px]", isTop && "font-semibold")}
      />
      {moving && (
        <select
          aria-label={t("parent")}
          value={parentId ?? ""}
          onChange={(e) => {
            setMoving(false);
            run(() => editCategoryParent({ id, parentId: e.target.value ? Number(e.target.value) : null }));
          }}
          className={cn(FIELD_CLASS, "w-52")}
        >
          <option value="">{t("noParent")}</option>
          {tops
            .filter((top) => top.id !== id)
            .map((top) => (
              <option key={top.id} value={top.id}>
                {top.name}
              </option>
            ))}
        </select>
      )}
      <Link
        href={{ pathname: "/admin/artikli", query: { kategorija: id } }}
        className="w-16 text-right text-xs text-[var(--text-muted)] hover:text-[var(--accent-bright)]"
      >
        {t("products", { count: products })}
      </Link>
      <div className="ml-2 flex items-center">
        <Button
          variant="icon"
          aria-label={c("moveUp")}
          title={c("moveUp")}
          disabled={pending || isFirst}
          onClick={() => run(() => editCategoryOrder({ id, direction: "up" }))}
        >
          <Icon name="up" size={16} />
        </Button>
        <Button
          variant="icon"
          aria-label={c("moveDown")}
          title={c("moveDown")}
          disabled={pending || isLast}
          onClick={() => run(() => editCategoryOrder({ id, direction: "down" }))}
        >
          <Icon name="down" size={16} />
        </Button>
        <Button
          variant="icon"
          aria-label={t("move")}
          title={canMove ? t("move") : t("moveBlocked")}
          aria-expanded={moving}
          disabled={pending || !canMove}
          onClick={() => setMoving(!moving)}
        >
          <Icon name="move" size={16} />
        </Button>
        <Button
          variant="icon"
          aria-label={c("delete")}
          title={blocked ?? c("delete")}
          disabled={pending || blocked !== null}
          onClick={() => {
            if (window.confirm(c("confirmDelete"))) run(() => removeCategory({ id }));
          }}
        >
          <Icon name="trash" size={16} />
        </Button>
      </div>
    </div>
  );
}

function AddForm({
  label,
  parentId,
  run,
  pending,
}: {
  label: string;
  parentId: number | null;
  run: Run;
  pending: boolean;
}) {
  const c = useTranslations("common");
  const [name, setName] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => addCategory({ name, parentId }),
          () => setName(""),
        );
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

export function CategoryManager({ tree }: { tree: CategoryNode[] }) {
  const t = useTranslations("categories");
  const { run, pending, error } = useAdminAction();
  const tops = tree.map((n) => ({ id: n.id, name: n.name }));

  return (
    <>
      <div aria-live="polite" className="mb-3 min-h-5">
        {error && <Caption tone="error">{error}</Caption>}
      </div>
      <ul className="flex flex-col gap-3">
        {tree.map((top, topIndex) => (
          <li key={`${top.id}-${top.name}`} className="border border-[var(--border-subtle)] p-3">
            <Row
              id={top.id}
              name={top.name}
              products={top.total}
              blocked={top.total > 0 || top.children.length > 0 ? t("deleteBlocked") : null}
              tops={tops}
              parentId={null}
              canMove={top.children.length === 0}
              isFirst={topIndex === 0}
              isLast={topIndex === tree.length - 1}
              isTop
              run={run}
              pending={pending}
            />
            <ul className="mt-1 ml-2 border-l border-[var(--border-subtle)] pl-3">
              {top.children.map((child, index) => (
                <li
                  key={`${child.id}-${child.name}-${top.id}`}
                  className="border-b border-[var(--border-subtle)] last:border-b-0"
                >
                  <Row
                    id={child.id}
                    name={child.name}
                    products={child.products}
                    blocked={child.products > 0 ? t("deleteBlocked") : null}
                    tops={tops}
                    parentId={top.id}
                    canMove
                    isFirst={index === 0}
                    isLast={index === top.children.length - 1}
                    run={run}
                    pending={pending}
                  />
                </li>
              ))}
              <li className="mt-2 max-w-md">
                <AddForm label={t("newSub")} parentId={top.id} run={run} pending={pending} />
              </li>
            </ul>
          </li>
        ))}
      </ul>
      <div className="mt-6 max-w-md">
        <AddForm label={t("newTop")} parentId={null} run={run} pending={pending} />
      </div>
    </>
  );
}
