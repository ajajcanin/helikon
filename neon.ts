import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Postgres only: login runs in the app (Better Auth), images on Cloudflare R2.
  auth: false,
  // No branch expiry: the dev branch must stay. Neon's default would delete new branches after 7 days.
  branch: () => ({}),
});
