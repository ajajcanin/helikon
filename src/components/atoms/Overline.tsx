type OverlineProps = {
  children: React.ReactNode;
  tone?: "muted" | "accent";
  size?: "xs" | "sm" | "md";
  className?: string;
};

const TONE_CLASSES: Record<NonNullable<OverlineProps["tone"]>, string> = {
  muted: "text-[var(--text-muted)]",
  accent: "text-[var(--accent)]",
};

const SIZE_CLASSES: Record<NonNullable<OverlineProps["size"]>, string> = {
  xs: "text-[8px] tracking-[0.34em]",
  sm: "text-[11px] tracking-[0.2em]",
  md: "text-xs tracking-[0.28em]",
};

export function Overline({
  children,
  tone = "muted",
  size = "sm",
  className = "",
}: OverlineProps) {
  return (
    <span
      className={`font-ui font-medium uppercase ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </span>
  );
}
