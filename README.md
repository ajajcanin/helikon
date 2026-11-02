# Helikon

Website and shop for Helikon, a Sarajevo art-supplies shop. Decisions and the build plan are in
[docs/architecture.md](docs/architecture.md), and environments in [docs/deployment.md](docs/deployment.md).

## Develop

Needs Node 24 and Docker Desktop.

```bash
./setup.sh --start        # first run: .env, Docker, packages, migrations, your admin user, then the app
pnpm lefthook install     # once: pre-commit checks and commit message rules
```

The database is Neon's `development` branch, set in `.env.development`. Docker runs a separate test database on 5435,
Mailpit on http://localhost:8026, and an S3 server on 9100 standing in for R2.
Admin login: http://localhost:3000/admin.

## Scripts

- `pnpm dev`, `pnpm build`, `pnpm start` - the app
- `pnpm lint`, `pnpm format` - Biome
- `pnpm typecheck` - generate route types, then `tsc --noEmit`
- `pnpm test` - unit and database tests, against a separate test database
- `pnpm storybook` - component workbench on port 6007
- `pnpm db:migrate`, `pnpm db:migrate:dev`, `pnpm db:studio` - database
- `pnpm db:import "<file.xlsx>" [--dry-run] [--reclassify]` - import the supplier sheet; `--reclassify` re-applies
  the category rules to existing products, replacing manual changes
- `pnpm db:dev-publish` - development only: publish everything and add sample delivery prices
- `pnpm user:create` - create a staff user

## Environment

Every setting is explained in `.env.example`, and they all live in one file, `.env.development`. `server/env.ts` validates them at startup. Before deploying, read
"Before this reaches production" in [docs/architecture.md](docs/architecture.md).

## Structure

| Folder        | Holds                                                              |
| ------------- | ------------------------------------------------------------------ |
| `app/`        | Routes only                                                        |
| `features/`   | One folder per business area, with its components and logic        |
| `components/` | Shared UI layers, see [components/README.md](components/README.md) |
| `server/`     | Server-only code: env, email and later database, jobs, storage     |
| `styles/`     | Global CSS and Vault tokens                                        |
| `docs/`       | Decisions and plan                                                 |

## Brand assets

- Favicon: `app/icon.svg`, picked up by Next's file-based icon convention, plus `public/favicon.ico`.
- Share preview: `public/images/og-image.jpg` (1200×630), referenced in `app/[locale]/layout.tsx`.
