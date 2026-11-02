import path from "node:path";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ quiet: true });
const root = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "server-only", replacement: path.join(root, "tests/empty.ts") },
      { find: /^@\//, replacement: `${root}/` },
    ],
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    globalSetup: ["tests/global-setup.ts"],
    // The database tests share one Postgres database.
    fileParallelism: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret",
      NEXT_PUBLIC_MEDIA_URL: process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost/media",
    },
  },
});
