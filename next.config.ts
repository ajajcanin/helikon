import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";
const mediaOrigin = process.env.NEXT_PUBLIC_MEDIA_URL
  ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL).origin
  : "";

/**
 * Content-Security-Policy: own site + Google Analytics (only loads when NEXT_PUBLIC_GA_MEASUREMENT_ID is set) +
 * Turnstile + product photos and admin uploads on object storage. Add new services here. Vercel already sends Strict-Transport-Security.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com ${mediaOrigin}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""} https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://challenges.cloudflare.com https://*.r2.cloudflarestorage.com ${mediaOrigin}`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["pg", "sharp", "pino", "pino-pretty", "exceljs"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Only production is indexed. Everything else asks search engines to stay out.
      ...(process.env.VERCEL_ENV === "production"
        ? []
        : [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]),
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.helikon.ba" }],
        destination: "https://helikon.ba/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
