import { getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { listCategoryTree } from "@/features/catalog/categories";
import { CategoryManager } from "@/features/catalog/components/CategoryManager";

export default async function CategoriesPage() {
  const [tree, t] = await Promise.all([listCategoryTree(), getTranslations("categories")]);
  return (
    <>
      <PageTitle intro={t("intro")}>{t("title")}</PageTitle>
      <CategoryManager tree={tree} />
    </>
  );
}
