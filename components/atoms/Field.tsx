import { type ReactNode, useId } from "react";
import { cn } from "@/lib/cn";

export const FIELD_CLASS =
  "w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-well)] px-2.5 py-2 font-ui text-sm text-[var(--text-display)] outline-none focus:border-[var(--accent)] disabled:opacity-45";

/** A name in a list that reads as text until you hover or click it. */
export const INLINE_FIELD_CLASS =
  "w-auto min-w-0 flex-1 rounded-[2px] border border-transparent bg-transparent px-2 py-1.5 font-ui text-sm text-[var(--text-display)] outline-none hover:border-[var(--border-subtle)] focus:border-[var(--accent)] focus:bg-[var(--bg-well)]";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Input({ label, className, ...props }: InputProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-ui text-xs text-[var(--text-secondary)]">
        {label}
      </label>
      <input id={id} className={FIELD_CLASS} {...props} />
    </div>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode };

export function Select({ label, className, children, ...props }: SelectProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-ui text-xs text-[var(--text-secondary)]">
        {label}
      </label>
      <select id={id} className={FIELD_CLASS} {...props}>
        {children}
      </select>
    </div>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("flex items-center gap-2 font-ui text-sm", className)}>
      <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" {...props} />
      {label}
    </label>
  );
}
