import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { BodyParagraph } from "@/components/atoms/BodyParagraph";
import { Heading } from "@/components/atoms/Heading";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Maintenance() {
  const t = useTranslations("maintenance");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--bg-page)] px-8 text-center">
      <Heading>{t("title")}</Heading>
      <BodyParagraph>{t("text")}</BodyParagraph>
    </main>
  );
}
