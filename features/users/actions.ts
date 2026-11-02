"use server";

import { z } from "zod";
import { adminAction } from "@/server/admin/action";
import { actorOf } from "@/server/admin/session";
import { createUser, setUserActive, setUserPassword, setUserRole } from "./users";

const admin = { role: "ADMINISTRATOR" } as const;
const role = z.enum(["ADMINISTRATOR", "UREDNIK"]);
const id = z.string().min(1);

export const addUser = adminAction(
  z.object({ name: z.string().max(120), email: z.string().max(254), password: z.string().max(200), role }),
  async (input, user) => {
    await createUser(input, actorOf(user));
    return { data: undefined };
  },
  admin,
);

export const changeUserActive = adminAction(
  z.object({ id, active: z.boolean() }),
  async ({ id, active }, user) => {
    await setUserActive(id, active, actorOf(user));
    return { data: undefined };
  },
  admin,
);

export const changeUserRole = adminAction(
  z.object({ id, role }),
  async ({ id, role }, user) => {
    await setUserRole(id, role, actorOf(user));
    return { data: undefined };
  },
  admin,
);

export const changeUserPassword = adminAction(
  z.object({ id, password: z.string().max(200) }),
  async ({ id, password }, user) => {
    await setUserPassword(id, password, actorOf(user));
    return { data: undefined };
  },
  admin,
);
