import "server-only";
import { Resend } from "resend";
import { env } from "@/server/env";

let client: Resend | undefined;

export function getResendClient() {
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}
