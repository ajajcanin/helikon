import "server-only";
import nodemailer from "nodemailer";
import { getResendClient } from "@/server/email/resend";
import { env } from "@/server/env";
import { logger } from "@/server/logger";

export type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

/**
 * Sends one e-mail: through Mailpit when SMTP_HOST is set (local), through Resend when its key is set (production).
 * With neither, as on the dev site, nothing is sent: development never uses production's accounts.
 */
export async function sendMail(mail: Mail) {
  if (env.SMTP_HOST) {
    const transport = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT });
    await transport.sendMail({ from: env.EMAIL_FROM, ...mail });
  } else if (env.RESEND_API_KEY) {
    const { error } = await getResendClient().emails.send({ from: env.EMAIL_FROM, ...mail });
    if (error) throw new Error(`Resend: ${error.message}`);
  } else {
    logger.info({ subject: mail.subject }, "no e-mail service configured, not sent");
    return;
  }
  logger.info({ subject: mail.subject }, "e-mail sent");
}
