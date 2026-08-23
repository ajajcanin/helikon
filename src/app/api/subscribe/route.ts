import { NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";
import { isValidEmail } from "@/lib/validate-email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { email, company } = body as { email?: unknown; company?: unknown };

  // Honeypot: humans leave this field empty. Report success without storing
  // anything, so bots that filled it don't learn the field is monitored.
  if (typeof company === "string" && company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId || !process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "server_misconfigured" },
      { status: 500 },
    );
  }

  const { error } = await getResendClient().contacts.create({
    email,
    audienceId,
    unsubscribed: false,
  });

  // An already-subscribed address is treated as success, not a failure.
  if (error && !/already|exists/i.test(error.message)) {
    return NextResponse.json({ ok: false, error: "subscribe_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
