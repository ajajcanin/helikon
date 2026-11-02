/** Company details, used by the shop, e-mails and documents, so they sit below all features. */
import { z } from "zod";
import { getSetting } from "@/server/settings";

export const COMPANY_KEY = "company";

export const companySchema = z.object({
  legalName: z.string().trim().min(2).max(120),
  address: z.string().trim().max(120),
  city: z.string().trim().max(120),
  phone: z.string().trim().max(40),
  email: z.string().trim().max(254),
  web: z.string().trim().max(120),
  court: z.string().trim().max(120),
  mbs: z.string().trim().max(40),
  jib: z.string().trim().max(40),
  bankAccount: z.string().trim().max(40),
  inPdv: z.boolean(),
  pdvNumber: z.string().trim().max(40),
  orderEmail: z.string().trim().max(254),
  invoiceNote: z.string().trim().max(500),
  openingHours: z.string().trim().max(500),
});

export type CompanySettings = z.infer<typeof companySchema>;

/** Starts from what the website shows anyway. JIB, MBS and bank account are entered in Postavke: the repository is public. */
const DEFAULTS: CompanySettings = {
  legalName: "HELIKON d.o.o. Sarajevo",
  address: "Fra Anđela Zvizdovića 8",
  city: "71000 Sarajevo, Bosna i Hercegovina",
  phone: "+387 61 284 433",
  email: "info@helikon.ba",
  web: "helikon.ba",
  court: "Općinski sud u Sarajevu",
  mbs: "",
  jib: "",
  bankAccount: "",
  inPdv: false,
  pdvNumber: "",
  orderEmail: "info@helikon.ba",
  invoiceNote: "Firma nije u sistemu PDV-a.",
  openingHours: "",
};

export async function getCompanySettings(): Promise<CompanySettings> {
  return { ...DEFAULTS, ...(await getSetting<Partial<CompanySettings>>(COMPANY_KEY, {})) };
}
