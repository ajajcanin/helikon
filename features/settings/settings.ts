import { UserError } from "@/server/admin/action";
import type { AuditActor } from "@/server/audit";
import { COMPANY_KEY, type CompanySettings, companySchema } from "@/server/company";
import { setSetting } from "@/server/settings";

export async function saveCompanySettings(input: CompanySettings, actor: AuditActor) {
  const data = companySchema.parse(input);
  if (data.inPdv && !data.pdvNumber) throw new UserError("Unesite PDV broj.");
  await setSetting(COMPANY_KEY, data, actor);
}
