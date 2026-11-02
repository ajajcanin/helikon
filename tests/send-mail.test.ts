import { afterEach, describe, expect, it, vi } from "vitest";

describe("sendMail without any e-mail service", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("sends nothing and doesn't fail, as on the dev site", async () => {
    vi.stubEnv("SMTP_HOST", undefined);
    vi.stubEnv("RESEND_API_KEY", undefined);
    vi.resetModules();
    const { sendMail } = await import("@/server/email/send");
    await expect(
      sendMail({ to: "a@example.com", subject: "Test", html: "x", text: "x" }),
    ).resolves.toBeUndefined();
  });
});
