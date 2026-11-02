import { defineRouting } from "next-intl/routing";

/** Bosnian only for now. English/German can be added later without changing Bosnian URLs. */
export const routing = defineRouting({
  locales: ["bs"],
  defaultLocale: "bs",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
