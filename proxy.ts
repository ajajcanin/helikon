import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  // Maintenance comes from an env variable, not the database: a check per request would keep Neon awake.
  if (process.env.MAINTENANCE_MODE === "true" && !isAdmin && pathname !== "/odrzavanje") {
    return NextResponse.rewrite(new URL(`/${routing.defaultLocale}/odrzavanje`, req.url), {
      status: 503,
      // The page is static, but a 503 must never be stored, or it could outlast the maintenance.
      headers: { "retry-after": "3600", "cache-control": "no-store" },
    });
  }
  return intl(req);
}

export const config = {
  // Everything except API routes, Next internals, static files and generated metadata routes.
  matcher: ["/((?!api|_next|_vercel|images|.*\\..*).*)"],
};
