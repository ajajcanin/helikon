import Image from "next/image";
import starGold from "../../../public/images/star-gold.svg";

type StarMarkProps = {
  size: "sm" | "lg";
  alt: string;
  className?: string;
};

const DIMENSIONS: Record<StarMarkProps["size"], { width: number; height: number }> = {
  sm: { width: 26, height: 36 },
  lg: { width: 62, height: 86 },
};

export function StarMark({ size, alt, className = "" }: StarMarkProps) {
  const { width, height } = DIMENSIONS[size];

  return (
    <Image
      src={starGold}
      alt={alt}
      width={width}
      height={height}
      priority
      className={`block ${size === "lg" ? "star-glow animate-seal-in" : ""} ${className}`}
    />
  );
}
