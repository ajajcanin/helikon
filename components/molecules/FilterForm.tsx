"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useRef, useTransition } from "react";

const TYPING_PAUSE_MS = 300;

/**
 * Applies filters as they change: lists at once, text after a pause in typing. They stay in the address, so a filtered
 * page can be shared or reloaded, and it's still a GET form until the page is interactive.
 */
export function FilterForm({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pending, start] = useTransition();

  useEffect(() => () => clearTimeout(timer.current), []);

  // Links such as "clear filters" change the address without reloading, so bring the fields in line.
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
  }, [searchParams]);

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

  function changed(event: FormEvent<HTMLFormElement>) {
    const field = event.target;
    const typing = field instanceof HTMLInputElement && field.type !== "checkbox";
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
      {children}
    </form>
  );
}
