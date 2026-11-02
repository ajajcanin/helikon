"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string;
      remove: (id: string) => void;
    };
  }
}

/** Cloudflare Turnstile human check. Free, no tracking cookies. */
export function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  const mount = useCallback(() => {
    if (!ref.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(ref.current, { sitekey: siteKey, callback: onToken });
  }, [siteKey, onToken]);

  useEffect(() => {
    mount();
    return () => {
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [mount]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={mount}
      />
      <div ref={ref} className="mt-3" />
    </>
  );
}
