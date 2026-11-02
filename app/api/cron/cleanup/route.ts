import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { env } from "@/server/env";

/** Daily Vercel Cron (vercel.json): removes expired sessions and old rate-limit rows. */
export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const dayAgo = new Date(Date.now() - 86_400_000);
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.verification.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.rateCounter.deleteMany({ where: { windowStart: { lt: dayAgo } } });
  await db.rateLimit.deleteMany({ where: { lastRequest: { lt: BigInt(dayAgo.getTime()) } } });
  return NextResponse.json({ ok: true });
}
