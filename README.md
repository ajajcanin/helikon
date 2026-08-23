# Helikon - coming-soon page

Next.js (App Router, TypeScript, Tailwind CSS) coming-soon page for Helikon,
a Sarajevo art-supplies shop. Root `/` renders the page; `/api/subscribe`
stores email signups as Resend contacts.

## Develop

```bash
pnpm install
pnpm dev
```

## Scripts

- `pnpm dev` - start the dev server
- `pnpm build` - production build
- `pnpm start` - run the production build
- `pnpm lint` - ESLint (fails on warnings)
- `pnpm format` / `pnpm format:check` - Prettier
- `pnpm typecheck` - `tsc --noEmit`

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `RESEND_API_KEY` - Resend API key (contacts-only; no email is ever sent)
- `RESEND_AUDIENCE_ID` - the Resend Audience to add signups to
- `NEXT_PUBLIC_SITE_URL` - used for absolute Open Graph/Twitter image URLs

## Brand assets

- Favicon: `src/app/icon.svg` (the brand star mark), picked up automatically
  by Next's file-based icon convention, plus `public/favicon.ico` for
  broader compatibility.
- Share preview: `public/images/og-image.jpg` - 1200×630, referenced in
  `src/app/layout.tsx`. Built from the same star mark and wordmark used in
  the site header.

## Structure

`src/components/` follows atomic design as a convention, not a mandate - see
[src/components/README.md](src/components/README.md). Only the pieces the
coming-soon page renders exist; other page designs from the design export
stay out of the build until they're built for real.
