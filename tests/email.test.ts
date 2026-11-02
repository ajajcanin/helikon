import { describe, expect, it } from "vitest";
import { sendMail } from "@/server/email/send";

const MAILPIT = "http://localhost:8026/api/v1";
const up = await fetch(`${MAILPIT}/info`)
  .then((r) => r.ok)
  .catch(() => false);

// Needs Mailpit from Docker (./setup.sh); skipped where it isn't running.
describe.skipIf(!up || !process.env.SMTP_HOST)("sendMail", () => {
  it("delivers locally through Mailpit", async () => {
    const subject = `Test ${Date.now()}`;
    await sendMail({ to: "kupac@example.com", subject, html: "<p>x</p>", text: "x" });
    const found = (await (
      await fetch(`${MAILPIT}/search?query=${encodeURIComponent(`subject:"${subject}"`)}`)
    ).json()) as { messages: unknown[] };
    expect(found.messages).toHaveLength(1);
  });
});
