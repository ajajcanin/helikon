type CaptionProps = {
  children: React.ReactNode;
  tone?: "muted" | "error" | "accent";
  className?: string;
};

const TONE_CLASSES: Record<NonNullable<CaptionProps["tone"]>, string> = {
  muted: "text-[var(--text-muted)]",
  error: "text-[var(--error)]",
  accent: "text-[var(--accent-bright)]",
};

export function Caption({ children, tone = "muted", className = "" }: CaptionProps) {
  return (
    <p className={`font-ui text-[13px] leading-[1.5] ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </p>
  );
}
