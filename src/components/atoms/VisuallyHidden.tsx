type VisuallyHiddenProps = {
  children: React.ReactNode;
  as?: "span" | "label";
  htmlFor?: string;
};

export function VisuallyHidden({ children, as = "span", htmlFor }: VisuallyHiddenProps) {
  const Tag = as;
  return (
    <Tag htmlFor={htmlFor} className="sr-only">
      {children}
    </Tag>
  );
}
