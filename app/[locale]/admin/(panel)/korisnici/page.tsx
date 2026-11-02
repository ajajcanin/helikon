import { getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/atoms/PageTitle";
import { UserManager } from "@/features/users/components/UserManager";
import { listUsers } from "@/features/users/users";
import { requirePageUser } from "@/server/admin/session";

export default async function UsersPage() {
  const me = await requirePageUser("ADMINISTRATOR");
  const [users, t] = await Promise.all([listUsers(), getTranslations("users")]);
  return (
    <>
      <PageTitle intro={t("intro")}>{t("title")}</PageTitle>
      <UserManager users={users} selfId={me.id} />
    </>
  );
}
