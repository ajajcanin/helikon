import { useTranslations } from "next-intl";
import { Heading } from "@/components/atoms/Heading";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--bg-page)] px-8 text-center">
      <Heading>{t("title")}</Heading>
      <Link href="/" className="font-ui text-sm text-[var(--accent-bright)] underline underline-offset-4">
        {t("home")}
      </Link>
    </main>
  );
}
