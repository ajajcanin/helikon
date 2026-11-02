import { NextResponse } from "next/server";
import { searchSuggestions } from "@/server/public/catalog";
import { clientIp, rateLimit } from "@/server/rate-limit";

const MIN_LENGTH = 2;
const MAX_LENGTH = 100;

/** For the search box. A route, not a server action, because actions run one at a time and typing sends many. */
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, MAX_LENGTH);
  if (q.length < MIN_LENGTH) return NextResponse.json({ total: 0, rows: [] });
  if (!(await rateLimit(`search:${clientIp(request.headers)}`, 120, 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  return NextResponse.json(await searchSuggestions(q), { headers: { "cache-control": "no-store" } });
}
