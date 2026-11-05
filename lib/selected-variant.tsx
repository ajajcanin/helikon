"use client";

import { createContext, useContext, useState } from "react";

type SelectedVariant = { selectedId: number | undefined; select: (id: number) => void };

const Context = createContext<SelectedVariant | null>(null);

/** The size chosen on a product page, shared by the size picker and the photos. */
export function SelectedVariantProvider({
  initialId,
  children,
}: {
  initialId: number | undefined;
  children: React.ReactNode;
}) {
  const [selectedId, select] = useState(initialId);
  return <Context.Provider value={{ selectedId, select }}>{children}</Context.Provider>;
}

export function useSelectedVariant() {
  const selected = useContext(Context);
  if (!selected) throw new Error("useSelectedVariant needs a SelectedVariantProvider");
  return selected;
}
