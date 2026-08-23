# Helikon — coming-soon page

Next.js (App Router, TypeScript, Tailwind CSS) coming-soon page for Helikon,
a Sarajevo art-supplies shop. Root `/` renders the page; `/api/subscribe`
stores email signups as Resend contacts.

## Develop

```bash
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint (fails on warnings)
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm typecheck` — `tsc --noEmit`

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `RESEND_API_KEY` — Resend API key (contacts-only; no email is ever sent)
- `RESEND_AUDIENCE_ID` — the Resend Audience to add signups to
- `NEXT_PUBLIC_SITE_URL` — used for absolute Open Graph/Twitter image URLs

## Assets still needed

- `public/favicon.ico` (or `src/app/icon.png`) — browser-tab icon
- `public/images/og-image.jpg` — 1200×630 share-preview image referenced in
  `src/app/layout.tsx`

## Structure

`src/components/` follows atomic design as a convention, not a mandate — see
[src/components/README.md](src/components/README.md). Only the pieces the
coming-soon page renders exist; other page designs from the design export
stay out of the build until they're built for real.
