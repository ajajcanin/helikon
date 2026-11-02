import "server-only";
import nodemailer from "nodemailer";
import { getResendClient } from "@/server/email/resend";
import { env } from "@/server/env";
import { logger } from "@/server/logger";

export type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

/** Sends one e-mail: through Mailpit when SMTP_HOST is set (local), otherwise through Resend. */
export async function sendMail(mail: Mail) {
  if (env.SMTP_HOST) {
    const transport = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT });
    await transport.sendMail({ from: env.EMAIL_FROM, ...mail });
  } else {
    const { error } = await getResendClient().emails.send({ from: env.EMAIL_FROM, ...mail });
    if (error) throw new Error(`Resend: ${error.message}`);
  }
  logger.info({ subject: mail.subject }, "e-mail sent");
}
