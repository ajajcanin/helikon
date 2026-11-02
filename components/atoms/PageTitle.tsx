import type { ReactNode } from "react";

export function PageTitle({ children, intro }: { children: ReactNode; intro?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl tracking-[0.08em]">{children}</h1>
      {intro && <p className="mt-2 font-ui text-sm text-[var(--text-secondary)]">{intro}</p>}
    </div>
  );
}
