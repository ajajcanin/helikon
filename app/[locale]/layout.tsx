import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Cinzel, EB_Garamond, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { env } from "@/server/env";
import "@/styles/globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  return {
    metadataBase: new URL(siteUrl),
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: siteUrl,
      siteName: "Helikon",
      images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
      locale: "bs_BA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/images/og-image.jpg"],
    },
    // Only production is indexed: Vercel's protection doesn't always cover a custom dev domain.
    robots: process.env.VERCEL_ENV === "production" ? undefined : { index: false, follow: false },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const gaId = env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang={locale}
      className={`${cinzel.variable} ${ebGaramond.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full font-body">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
