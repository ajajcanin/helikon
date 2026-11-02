import { cn } from "@/lib/cn";

/** A smear of paint in the product's colour, as in the design. `color` null shows the seal for items with no colour. */
export function PaintSwatch({ color, className }: { color: string | null; className?: string }) {
  return (
    <div className={cn("hk-swatch overflow-hidden", className)} aria-hidden="true">
      {color ? (
        // biome-ignore lint/a11y/noSvgWithoutTitle: decorative, hidden from screen readers by its parent
        <svg viewBox="0 0 100 76" preserveAspectRatio="none" className="absolute inset-0 block h-full w-full">
          <rect x="8" y="8" width="84" height="60" fill={color} />
        </svg>
      ) : (
        // biome-ignore lint/performance/noImgElement: a small decorative SVG that needs no optimisation
        <img src="/images/star-gold.svg" alt="" className="absolute inset-0 m-auto h-1/2 w-1/2 opacity-25" />
      )}
    </div>
  );
}

/** Defined once per page, because every swatch's smear refers to it. */
export function SmearFilter() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <filter id="hk-smear" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.011 0.02" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="24" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
