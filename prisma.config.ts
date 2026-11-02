import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.development", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrations need Neon's direct connection; the app uses the pooled DATABASE_URL.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
});
