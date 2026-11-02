import pino from "pino";

/** Structured logs, sent to Vercel's logs and never to the database. Never log passwords or customer data. */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV === "development"
    ? { transport: { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } } }
    : {}),
  redact: ["password", "*.password", "email", "*.email", "phone", "*.phone"],
});
