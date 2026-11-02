import { redirect } from "next/navigation";
import { LoginForm } from "@/features/admin/components/LoginForm";
import { getAdminUser } from "@/server/admin/session";

export default async function LoginPage() {
  if (await getAdminUser()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <LoginForm />
    </main>
  );
}
