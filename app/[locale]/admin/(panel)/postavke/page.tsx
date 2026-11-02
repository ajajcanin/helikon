import { getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { CompanyForm } from "@/features/settings/components/CompanyForm";
import { requirePageUser } from "@/server/admin/session";
import { getCompanySettings } from "@/server/company";

export default async function SettingsPage() {
  await requirePageUser("ADMINISTRATOR");
  const [company, t] = await Promise.all([getCompanySettings(), getTranslations("settings")]);
  return (
    <>
      <PageTitle>{t("title")}</PageTitle>
      <CompanyForm initial={company} />
    </>
  );
}
