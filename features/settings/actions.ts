"use server";

import { adminAction } from "@/server/admin/action";
import { actorOf } from "@/server/admin/session";
import { companySchema } from "@/server/company";
import { saveCompanySettings } from "./settings";

export const saveCompany = adminAction(
  companySchema,
  async (input, user) => {
    await saveCompanySettings(input, actorOf(user));
    return { data: undefined };
  },
  { role: "ADMINISTRATOR" },
);
