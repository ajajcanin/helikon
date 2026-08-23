import Image from "next/image";
import storefront from "../../../public/images/shop-storefront.png";
import stampGold from "../../../public/images/stamp-gold.svg";

export function HeroBackdrop() {
  return (
    <>
      <div
        className="animate-glow pointer-events-none absolute inset-0"
        style={{ background: "var(--glow-pool-strong)" }}
      />
      <Image
        src={storefront}
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover opacity-[0.14] mix-blend-screen"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 42%, rgba(23,20,15,0) 30%, var(--bg-page) 78%)",
        }}
      />
      <Image
        src={stampGold}
        alt=""
        width={720}
        height={720}
        loading="eager"
        className="pointer-events-none absolute -right-[220px] -bottom-[220px] opacity-5"
      />
    </>
  );
}
