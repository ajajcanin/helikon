import { execSync } from "node:child_process";

/** Brings the test database up to date. It is never the development database. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set");
  execSync("pnpm exec prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    stdio: "pipe",
  });
}
