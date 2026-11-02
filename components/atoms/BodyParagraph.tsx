type BodyParagraphProps = {
  children: React.ReactNode;
  className?: string;
};

export function BodyParagraph({ children, className = "" }: BodyParagraphProps) {
  return (
    <p
      className={`font-body text-[20px] leading-[1.66] text-[var(--text-secondary)] max-w-[52ch] ${className}`}
    >
      {children}
    </p>
  );
}
