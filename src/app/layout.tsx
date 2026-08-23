import type { Metadata } from "next";
import { Cinzel, EB_Garamond, Inter } from "next/font/google";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://helikon.ba";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Helikon - kuća umjetničkih materijala",
  description:
    "Uskoro otvaramo vrata Helikona - kuće umjetničkih materijala u Sarajevu. Prijavite se i budite prvi koji će znati.",
  openGraph: {
    title: "Helikon - kuća umjetničkih materijala",
    description:
      "Uskoro otvaramo vrata Helikona - kuće umjetničkih materijala u Sarajevu. Prijavite se i budite prvi koji će znati.",
    url: siteUrl,
    siteName: "Helikon",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }],
    locale: "bs_BA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Helikon - kuća umjetničkih materijala",
    description:
      "Uskoro otvaramo vrata Helikona - kuće umjetničkih materijala u Sarajevu. Prijavite se i budite prvi koji će znati.",
    images: ["/images/og-image.jpg"],
  },
  // TEMPORARY: coming-soon noindex. REMOVE this metadata robots block and the
  // X-Robots-Tag header in next.config before launching real homepage content.
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bs"
      className={`${cinzel.variable} ${ebGaramond.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full font-body">{children}</body>
    </html>
  );
}
