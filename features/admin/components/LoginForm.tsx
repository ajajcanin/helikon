"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Caption } from "@/components/atoms/Caption";
import { Heading } from "@/components/atoms/Heading";
import { SubmitButton } from "@/components/atoms/SubmitButton";
import { TextField } from "@/components/atoms/TextField";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const res = await authClient.signIn.email({ email, password });
    if (res.error) {
      setError(res.error.code === "ACCOUNT_LOCKED" ? t("locked") : t("loginFailed"));
      setPending(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[360px] flex-col gap-4">
      <Heading className="text-[32px]">{t("loginTitle")}</Heading>
      <TextField
        label={t("email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={setEmail}
        disabled={pending}
      />
      <TextField
        label={t("password")}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={setPassword}
        disabled={pending}
      />
      <SubmitButton loading={pending}>{pending ? t("loggingIn") : t("login")}</SubmitButton>
      <div aria-live="polite" role="status">
        {error && <Caption tone="error">{error}</Caption>}
      </div>
    </form>
  );
}
