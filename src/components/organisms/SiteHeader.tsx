import { BrandMark } from "../molecules/BrandMark";
import { Overline } from "../atoms/Overline";

export function SiteHeader() {
  return (
    <header className="relative z-2 mx-auto flex w-full max-w-[1100px] items-center justify-between gap-5 px-8 py-[34px] max-[720px]:px-[22px] max-[720px]:py-6">
      <BrandMark />
      <Overline size="sm" className="max-[460px]:hidden">
        Sarajevo · 2026
      </Overline>
    </header>
  );
}
