# Deployment

One Vercel project with two environments, each with its own database and settings.

| Environment | Branch    | Address                                     | Deploys                     |
| ----------- | --------- | ------------------------------------------- | --------------------------- |
| Dev         | `develop` | Vercel's branch URL, later `dev.helikon.ba` | Automatically on every push |
| Production  | `main`    | `helikon.ba`                                | Only by the manual action   |

Pull requests into `develop` also get their own Vercel preview URL, using dev's settings.

Nobody pushes to `main` by hand. The **Deploy to production** action (GitHub > Actions, run from `develop`, type
`deploy`) runs migrations on the production database, then moves `main` to `develop`'s latest commit. So what reaches
`helikon.ba` is exactly what was checked on dev.

Migrations run just before the new code goes live, so old code briefly runs against the new database. Make them
additive: add first, remove in a later release.

**The first run of the action is the launch.** It replaces the coming-soon page with the shop.

## Local development

Everything lives in one file, `.env.development` (git-ignored, see `.env.example`): the app, Prisma and the scripts all
read it, and it points at Neon's `development` branch. Docker provides only Mailpit, the S3 server and a separate database
for tests, so tests can never touch Neon.

## Set up once

Production keeps serving the coming-soon page throughout, because `main` doesn't change until the first manual deploy.

1. **GitHub > Settings > General:** make `develop` the default branch. GitHub only offers a manual action whose file is
   on the default branch.
2. **GitHub > Settings > Branches:** protect `main` so only the action can update it, and allow the action past the rule.
3. **Neon:** project `helikon` with branch `development` is the dev database. Production gets its own Neon project later.
4. **Vercel > Settings > Environment Variables**, in the existing project:
   - Preview, for all branches or `develop` only: `DATABASE_URL`, `DIRECT_URL` and `BETTER_AUTH_SECRET` from `.env.development`, `APP_URL` set to the branch URL Vercel shows for `develop`, and `CRON_SECRET`. Also `NEXT_PUBLIC_SITE_URL`, the same URL.
     Nothing from production: no Resend, no analytics. Without them dev sends no e-mail and tracks nothing.
   - Production, later: `DATABASE_URL`, `DIRECT_URL` and a different `BETTER_AUTH_SECRET` from its own Neon project, `APP_URL=https://helikon.ba`,
     `CRON_SECRET`, `RESEND_API_KEY`, and analytics.
5. **Vercel > Settings > Deployment Protection:** keep dev private. It has an admin panel and test data. Pages outside
   production also ask search engines not to index.
6. **GitHub > Settings > Secrets and variables > Actions:** `DEV_DIRECT_URL` and `PRODUCTION_DIRECT_URL`.
7. **Redeploy `develop`** so it picks up the settings, and run `pnpm user:create` with dev's `DATABASE_URL` for the first
   admin. Enter JIB, MBS and the bank account in Postavke: they aren't in the code, because the repository is public.

To use `dev.helikon.ba` later: Vercel > Settings > Domains, add it to Preview with Git branch `develop`, add the DNS
record in Cloudflare, and change `APP_URL`.

Check that existing Resend and analytics variables in Vercel are scoped to Production only. A variable set for all
environments would reach dev too.

## Images (Cloudflare R2)

Locally, images go to the S3 server in Docker. The dev site can't reach that, so uploading there fails, and images
uploaded locally don't show there, until R2 is set up. The Neon database is shared, so a local upload saved to a product
or article shows as a broken image on the dev site.

1. **Cloudflare > R2:** create the bucket `helikon-media`.
2. **Bucket > Settings > Custom domain:** connect `media.helikon.ba` (use a separate bucket or `media-dev.helikon.ba`
   if dev and production shouldn't share images).
3. **Bucket > Settings > CORS policy:** allow `PUT` with the `content-type` header from the site's addresses, because
   browsers upload directly to the bucket.
4. **R2 > Manage API tokens:** create a token with Object Read & Write for this bucket only.
5. **Vercel > Settings > Environment Variables:** `S3_ENDPOINT` (`https://<account-id>.r2.cloudflarestorage.com`),
   `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `NEXT_PUBLIC_MEDIA_URL` (`https://media.helikon.ba`),
   then redeploy, because `NEXT_PUBLIC_` values are fixed at build time.

## Before the first production deploy

- Move the data the client confirmed on dev to production, because the two databases are separate. Do it once:
  `pg_dump` from dev's direct URL and `pg_restore` into production, then remove test orders.
  This also carries the motifs of rice papers and stencils, so split any new series with `pnpm db:motifs` on dev first.
- Legal pages, a verified sending domain in Resend for order e-mails, Turnstile keys, real delivery prices, photos, and the
  PDV answer from the accountant.
- First admin on production: `pnpm user:create` with production's `DATABASE_URL`, unless the copied data has one.
- Vercel's Hobby plan is non-commercial only, so move to Pro.

## Rolling back

Vercel > Deployments: promote the previous production deployment to get the old code back at once. A later run of the
action deploys from `develop` again, so fix or revert `develop` too.
