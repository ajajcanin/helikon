type HeadingProps = {
  children: React.ReactNode;
  className?: string;
};

export function Heading({ children, className = "" }: HeadingProps) {
  return (
    <h1
      className={`font-display font-semibold uppercase text-[var(--text-display)] tracking-[0.06em] leading-[1.06] text-[clamp(32px,7vw,60px)] ${className}`}
    >
      {children}
    </h1>
  );
}
