import { HeroBackdrop } from "../organisms/HeroBackdrop";
import { SiteHeader } from "../organisms/SiteHeader";
import { HeroContent } from "../organisms/HeroContent";
import { SiteFooter } from "../organisms/SiteFooter";

export function ComingSoonTemplate() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--bg-page)]">
      <HeroBackdrop />
      <SiteHeader />
      <HeroContent />
      <SiteFooter />
    </main>
  );
}
