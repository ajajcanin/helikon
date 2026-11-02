"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Result = { ok: true; message?: string } | { ok: false; error: string };

/** Runs an admin action: shows its error, refreshes the page's data on success. */
export function useAdminAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const run = (fn: () => Promise<Result>, after?: () => void) =>
    start(async () => {
      setError(null);
      setSaved(false);
      const res = await fn();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      after?.();
      router.refresh();
    });

  return { pending, error, saved, run };
}
