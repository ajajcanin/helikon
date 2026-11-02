import { getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { ManufacturerManager } from "@/features/catalog/components/ManufacturerManager";
import { listManufacturers } from "@/features/catalog/manufacturers";

export default async function ManufacturersPage() {
  const [manufacturers, t] = await Promise.all([listManufacturers(), getTranslations("manufacturers")]);
  return (
    <>
      <PageTitle intro={t("intro")}>{t("title")}</PageTitle>
      <ManufacturerManager manufacturers={manufacturers} />
    </>
  );
}
