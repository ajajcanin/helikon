"use server";

import { z } from "zod";
import { adminAction, SHOP_UNCHANGED } from "@/server/admin/action";
import { db } from "@/server/db";

export const setTheme = adminAction(
  z.object({ theme: z.enum(["dark", "light"]) }),
  async ({ theme }, user) => {
    await db.user.update({ where: { id: user.id }, data: { theme } });
    return { data: theme };
  },
  SHOP_UNCHANGED,
);
