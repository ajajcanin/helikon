import { MediaImage } from "@/components/atoms/MediaImage";
import { cn } from "@/lib/cn";

type Props = React.ComponentProps<typeof MediaImage>;

/**
 * A product photo on a warm tile. Supplied photos have white backgrounds, which blend into the tile instead of
 * showing as a white box on the dark page, and the whole product stays visible instead of being cropped.
 */
export function ProductImage({ className, ...image }: Props) {
  return (
    <div className={cn("isolate overflow-hidden bg-[var(--product-tile)]", className)}>
      <MediaImage {...image} className="h-full w-full object-contain mix-blend-multiply" />
    </div>
  );
}
