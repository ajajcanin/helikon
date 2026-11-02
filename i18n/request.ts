import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    timeZone: "Europe/Sarajevo",
    // In development the file is read on every request, so new texts show up without a restart.
    messages:
      process.env.NODE_ENV === "development"
        ? JSON.parse(
            await (await import("node:fs/promises")).readFile(
              `${process.cwd()}/messages/${locale}.json`,
              "utf8",
            ),
          )
        : (await import(`../messages/${locale}.json`)).default,
    formats: {
      dateTime: {
        short: { day: "2-digit", month: "2-digit", year: "numeric" },
        long: { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" },
      },
    },
  };
});
