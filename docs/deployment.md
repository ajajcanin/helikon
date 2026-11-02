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

## Set up once

Production keeps serving the coming-soon page throughout, because `main` doesn't change until the first manual deploy.

1. **GitHub > Settings > General:** make `develop` the default branch. GitHub only offers a manual action whose file is
   on the default branch.
2. **GitHub > Settings > Branches:** protect `main` so only the action can update it, and allow the action past the rule.
3. **Neon:** one project in Frankfurt with a `production` branch and a `dev` branch. Each has a pooled and a direct URL.
4. **Vercel > Settings > Environment Variables**, in the existing project:
   - Preview, for all branches or `develop` only: `DATABASE_URL` (dev pooled), `DIRECT_URL`, a `BETTER_AUTH_SECRET`
     different from production's, `APP_URL` set to the branch URL Vercel shows for `develop`, and `CRON_SECRET`. Leave
     `RESEND_API_KEY` out unless dev should send real e-mail.
   - Production: `DATABASE_URL` (production pooled), `DIRECT_URL`, `BETTER_AUTH_SECRET`, `APP_URL=https://helikon.ba`,
     `CRON_SECRET`, `RESEND_API_KEY`, and analytics.
5. **Vercel > Settings > Deployment Protection:** keep dev private. It has an admin panel and test data. Pages outside
   production also ask search engines not to index.
6. **GitHub > Settings > Secrets and variables > Actions:** `DEV_DIRECT_URL` and `PRODUCTION_DIRECT_URL`.
7. **Redeploy `develop`** so it picks up the settings, and run `pnpm user:create` with dev's `DATABASE_URL` for the first
   admin. Enter JIB, MBS and the bank account in Postavke: they aren't in the code, because the repository is public.

To use `dev.helikon.ba` later: Vercel > Settings > Domains, add it to Preview with Git branch `develop`, add the DNS
record in Cloudflare, and change `APP_URL`.

## Before the first production deploy

- Move the data the client confirmed on dev to production, because the two databases are separate. Do it once:
  `pg_dump` from dev's direct URL and `pg_restore` into production, then remove test orders.
- Legal pages, a verified sending domain in Resend for order e-mails, Turnstile keys, real delivery prices, photos, and the
  PDV answer from the accountant.
- First admin on production: `pnpm user:create` with production's `DATABASE_URL`, unless the copied data has one.
- Vercel's Hobby plan is non-commercial only, so move to Pro.

## Rolling back

Vercel > Deployments: promote the previous production deployment to get the old code back at once. A later run of the
action deploys from `develop` again, so fix or revert `develop` too.
