import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  primary: "bg-[var(--accent)] font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-bright)]",
  outline:
    "border border-[var(--border-strong)] text-[var(--text-display)] hover:border-[var(--border-hover)]",
  danger: "border border-[var(--error)] text-[var(--error)]",
  /** Small icon button for actions in a list row. Needs an aria-label. */
  icon: "h-8 w-8 !p-0 text-[var(--text-muted)] hover:bg-[var(--accent-subtle)] hover:text-[var(--text-display)]",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS };

export function Button({ variant = "outline", type = "button", className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[2px] px-3 py-2 font-ui text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
