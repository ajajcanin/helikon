"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Caption } from "@/components/atoms/Caption";
import { Input, Select } from "@/components/atoms/Field";
import type { Role } from "@/generated/prisma/enums";
import { useAdminAction } from "@/lib/use-admin-action";
import { addUser, changeUserActive, changeUserPassword, changeUserRole } from "../actions";

type User = { id: string; name: string; email: string; role: Role; active: boolean };

function RoleOptions() {
  const t = useTranslations("users");
  return (
    <>
      <option value="UREDNIK">{t("UREDNIK")}</option>
      <option value="ADMINISTRATOR">{t("ADMINISTRATOR")}</option>
    </>
  );
}

function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const t = useTranslations("users");
  const { run, pending, error, saved } = useAdminAction();
  const [password, setPassword] = useState("");
  return (
    <li className="border border-[var(--border-subtle)] p-4">
      <div className="mb-3">
        <span className="font-semibold">{user.name}</span> {isSelf && t("you")}
        <span className="ml-2 text-[var(--text-muted)]">{user.email}</span>
        {!user.active && <span className="ml-2 text-[var(--error)]">{t("deactivate")}</span>}
      </div>
      <div className="grid items-end gap-3 md:grid-cols-[1fr_2fr_auto_auto]">
        <Select
          label={t("role")}
          value={user.role}
          disabled={pending}
          onChange={(e) => run(() => changeUserRole({ id: user.id, role: e.target.value as Role }))}
        >
          <RoleOptions />
        </Select>
        <Input
          label={t("newPassword")}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          disabled={pending || !password}
          onClick={() =>
            run(
              () => changeUserPassword({ id: user.id, password }),
              () => setPassword(""),
            )
          }
        >
          {t("setPassword")}
        </Button>
        {!isSelf && (
          <Button
            variant={user.active ? "danger" : "outline"}
            disabled={pending}
            onClick={() => run(() => changeUserActive({ id: user.id, active: !user.active }))}
          >
            {user.active ? t("deactivate") : t("activate")}
          </Button>
        )}
      </div>
      <div aria-live="polite" className="mt-2">
        {error && <Caption tone="error">{error}</Caption>}
        {saved && !error && <Caption>✓</Caption>}
      </div>
    </li>
  );
}

export function UserManager({ users, selfId }: { users: User[]; selfId: string }) {
  const t = useTranslations("users");
  const c = useTranslations("common");
  const { run, pending, error } = useAdminAction();
  const empty = { name: "", email: "", password: "", role: "UREDNIK" as Role };
  const [form, setForm] = useState(empty);
  return (
    <>
      <ul className="flex flex-col gap-4">
        {users.map((u) => (
          <UserRow key={`${u.id}-${u.role}-${u.active}`} user={u} isSelf={u.id === selfId} />
        ))}
      </ul>
      <h2 className="mt-8 mb-3 font-display text-base tracking-[0.04em]">{t("new")}</h2>
      <form
        className="grid items-end gap-3 border border-[var(--border-subtle)] p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () => addUser(form),
            () => setForm(empty),
          );
        }}
      >
        <Input
          label={c("name")}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label={t("email")}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label={t("password")}
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Select
          label={t("role")}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
        >
          <RoleOptions />
        </Select>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={pending}>
            {c("add")}
          </Button>
          {error && <Caption tone="error">{error}</Caption>}
        </div>
      </form>
    </>
  );
}
