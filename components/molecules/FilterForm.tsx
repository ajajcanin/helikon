"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  Suspense,
  useEffect,
  useRef,
  useTransition,
} from "react";

const TYPING_PAUSE_MS = 300;
const CARRY_MS = 5000;

/**
 * Plain and filtered catalogue lists are separate cached and live pages, so the first filter replaces the form. This
 * carries the field being used across, so typing can simply continue.
 */
let carried: { pathname: string; name: string; value: string; at: number } | null = null;

/**
 * Links such as "clear filters" change the address without reloading, so bring the fields in line. On its own, because
 * reading the address can't happen in a cached page's saved HTML, and the form itself should be in it.
 */
function SyncWithAddress({ form }: { form: RefObject<HTMLFormElement | null> }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    for (const field of Array.from(form.current?.elements ?? [])) {
      if (field === document.activeElement) continue;
      if (field instanceof HTMLSelectElement) {
        field.value = searchParams.get(field.name) ?? "";
        if (field.selectedIndex < 0) field.selectedIndex = 0;
      } else if (field instanceof HTMLInputElement && field.type === "checkbox") {
        field.checked = searchParams.has(field.name);
      } else if (field instanceof HTMLInputElement && field.type !== "hidden") {
        field.value = searchParams.get(field.name) ?? "";
      }
    }
  }, [searchParams, form]);
  return null;
}

/**
 * Applies filters as they change: lists at once, text after a pause in typing. They stay in the address, so a filtered
 * page can be shared or reloaded, and it's still a GET form until the page is interactive.
 */
export function FilterForm({
  className,
  children,
  pathname: fixedPathname,
}: {
  className?: string;
  children: ReactNode;
  /** The public address of this list, where the page behind it differs from what the browser shows. */
  pathname?: string;
}) {
  const router = useRouter();
  const currentPathname = usePathname();
  const pathname = fixedPathname ?? currentPathname;
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pending, start] = useTransition();

  function apply() {
    clearTimeout(timer.current);
    if (!form.current) return;
    const query = new URLSearchParams();
    for (const [name, value] of new FormData(form.current)) {
      if (typeof value === "string" && value.trim()) query.set(name, value.trim());
    }
    const search = query.toString();
    start(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: only when the form first appears
  useEffect(() => {
    const incoming = carried;
    if (incoming && incoming.pathname === pathname && Date.now() - incoming.at < CARRY_MS) {
      const field = Array.from(form.current?.elements ?? []).find(
        (el): el is HTMLInputElement | HTMLSelectElement =>
          (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) &&
          el.name === incoming.name &&
          el.type !== "hidden" &&
          el.offsetParent !== null,
      );
      if (field) {
        carried = null;
        field.focus();
        if (field instanceof HTMLInputElement && field.type !== "checkbox") {
          const typedSince = field.value !== incoming.value;
          field.value = incoming.value;
          if (typedSince) timer.current = setTimeout(apply, TYPING_PAUSE_MS);
        }
      }
    }
    return () => clearTimeout(timer.current);
  }, []);

  function changed(event: FormEvent<HTMLFormElement>) {
    const field = event.target;
    const typing = field instanceof HTMLInputElement && field.type !== "checkbox";
    if (fixedPathname && (field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) {
      carried = { pathname, name: field.name, value: field.value, at: Date.now() };
    }
    clearTimeout(timer.current);
    if (typing) timer.current = setTimeout(apply, TYPING_PAUSE_MS);
    else apply();
  }

  return (
    <form
      ref={form}
      method="get"
      aria-busy={pending}
      className={className}
      onChange={changed}
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <Suspense fallback={null}>
        <SyncWithAddress form={form} />
      </Suspense>
      {children}
    </form>
  );
}
