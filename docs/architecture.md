# Helikon architecture

Helikon follows the structure of the Univerzal Haen project, changed where a shop on Vercel needs something else.
Haen is a catalogue with inquiries and no checkout. Helikon sells online, so commerce is designed here from scratch.

## Decisions

| Area             | Decision                                                                                                | Why                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Hosting          | Vercel, Pro plan before launch, functions in `fra1`                                                     | Already deployed there. Hobby is non-commercial only. `fra1` sits next to the database                                        |
| Database         | Neon Postgres in Frankfurt, Prisma 7 with `PrismaPg`                                                    | Plain Postgres, easy to leave. Free while building, Launch before the first real order for the restore window of up to 7 days |
| Images           | Cloudflare R2 Standard on `media.helikon.ba`                                                            | No egress fees, S3-compatible. The domain must be in the same Cloudflare account as the bucket                                |
| Image sizes      | Generated once at upload with `sharp`                                                                   | Avoids Vercel image optimisation costs                                                                                        |
| Uploads          | Admin uploads go directly to R2                                                                         | Vercel limits request bodies to about 4.5 MB                                                                                  |
| Backups          | Scheduled database dump to a private R2 bucket                                                          | A copy outside Neon that goes back further than its restore window                                                            |
| Background jobs  | Vercel Cron instead of a `pg-boss` worker. Database backups run in GitHub Actions, which has `pg_dump`  | Vercel has no always-on process                                                                                               |
| Email            | Resend behind `server/email`                                                                            | Mailpit locally                                                                                                               |
| Logins           | Better Auth, staff only. Customers check out as guests                                                  | The design has no account screens                                                                                             |
| Admin writes     | `adminAction` plus audit row in the same transaction                                                    | Same pattern as Haen                                                                                                          |
| Audit log        | Postgres, changes only (changed fields), append-only. Logins and reading data are not logged            | About 1 KB per change                                                                                                         |
| App logs         | `pino` to Vercel logs, never the database                                                               | Would grow faster than everything else combined                                                                               |
| Public data      | Only through `server/public/`                                                                           | Purchase prices and margins must never reach public pages                                                                     |
| Text             | `next-intl`, `bs`, no URL prefix                                                                        | Painful to add later                                                                                                          |
| Spam             | Honeypot, Turnstile, rate limit in Postgres                                                             | Haen's in-memory limiter does not work on Vercel, whose instances share no memory                                             |
| Admin theme      | Light and dark, saved per user. Light is the design system's "Gallery" variant, in `styles/globals.css` | Each person keeps their choice, with no flash on load. Login stays dark because no user is known yet                          |
| Security headers | CSP and others in `next.config.ts`                                                                      | Vercel already sends HSTS                                                                                                     |
| Lint and tooling | Biome with layer rules, Lefthook, commitlint, pinned versions                                           | Same as Haen                                                                                                                  |

## Open decisions

- **Analytics:** Google Analytics stays until decided. Recommended: Cloudflare Web Analytics, which is cookieless,
  unless ads are planned soon. GA4 needs a consent banner and a privacy page.
- **Payment:** cash on delivery and payment by predračun first, cards later. Card provider not chosen.
- **Stock source:** Pantheon is expected to own stock and prices. See "Pantheon and POS".
- **Categories:** the tree comes from product names (`features/catalog/classify.ts`) and differs from the design's four
  sections, because the real stock has no canvases but a lot of decoupage, gilding, resin and effect products.
- **Colour families:** the design's eight plus Višebojne, Zlatne, Srebrne, Bronza i bakar, Biserne, which need filter labels and
  swatches in the catalogue. Metalik is a finish, so a metallic red stays in Crvene. Some are guesses from the name, noted on the
  product for the client to check. Marker shades come from Turkish shops, because Rich's site gives only numbers.
- **Product details:** line-level text and specs from Rich's catalogue, translated, in
  `features/catalog/product-details.ts`. The sheet never names Rich: lines were matched by colour names and sizes. There
  is no pigment or lightfastness data per colour, and oil paints aren't in the catalogue.
- **Sheet data:** see the import report for prices to check.
- **PDV:** status and pricing to confirm with the accountant, as well as fiscal receipts for online sales.

## Differences from Haen

- **Variants:** prices, stock and cart lines attach to a variant (one šifra, one size), not to a product. The supplier
  sheet has 701 šifre and no parent product, so its names must be split into product, colour and size at import.
- **Commerce:** cart, checkout, orders with frozen prices, delivery and payment states, stock re-check when ordering.
- **Invoices:** predračun and račun PDFs use the memorandum layout, with a tax rate stored per line.
- **Journal:** the design's "Dnevnik" needs its own content model.
- **Tests:** required from the start for prices, stock and orders. Haen has none.
- **Shared code:** `audit` and `settings` live in `server/`, so features never import each other. Unlike Haen, a test
  enforces this (`tests/architecture.test.ts`).
- **Maintenance mode:** an env variable, not a database setting, because a check per request would keep Neon awake.
- **Layer rules:** Biome patterns use `/**`. Haen's `/*` misses deep imports.
- **Not copied:** simulation, alerts, discount suggestions, the inquiry flow, "Za provjeru", the demo item.

## Storage estimate

Assuming 50 orders a day. Estimates, not measurements.

| Data                                     | Where | After 1 year | After 5 years |
| ---------------------------------------- | ----- | ------------ | ------------- |
| Catalogue, orders, audit log             | Neon  | About 200 MB | About 900 MB  |
| Photos (3 per item, 4 sizes) and backups | R2    | About 1.3 GB | About 3 GB    |

## Build order

Done and tested:

1. Structure and tooling
2. `next-intl`, Docker for local Postgres, Mailpit and S3, Prisma, Better Auth, `adminAction`, audit, Storybook, tests
3. Variant and order schema, placing orders, status flow, totals
4. Sheet import (`pnpm db:import`), public catalogue queries, storage and image sizes
5. Shop pages, cart and checkout, order e-mails
6. Admin: articles, categories, manufacturers, orders, delivery, analytics, users, settings, history
7. Content forms for the homepage and pages, a journal editor with images and product cards, and photo uploads

Still to build:

8. Order e-mail retries, password reset, predračun and račun PDFs, card payment, legal texts

Everything imported is a draft, so nothing appears publicly until it is reviewed and published.

## Pantheon and POS

Pantheon (Datalab) is the financial system and the expected owner of items, prices, stock and invoices. The shop owns
photos, descriptions and categories, and sends its orders to Pantheon. The connection itself is not built, because how
to reach it is not confirmed.

Ready now, and tested:

- **Data:** `SyncRun`, `ExternalSale`, `externalId` on variants and orders, and the `SYNC` stock reason.
- **Rules:** `features/integrations/sync.ts` applies stock and prices by šifra, records store sales, and lists orders to
  send. A connector only fetches and sends, then calls these.
- **Screens:** `/admin/integracije` and `/admin/analitika`. Analytics already counts web orders and adds store sales when
  they arrive.

To confirm with whoever maintains their Pantheon:

1. Version, and whether PAWS (Pantheon's web API add-on) is available and licensed. It is the preferred route. Reading
   Pantheon's SQL Server directly is a fallback, since its tables can change between updates.
2. Whether the šifre in the sheet are Pantheon's item ids. If not, fill `externalId`.
3. Where Pantheon runs and how an outside service reaches it (a VPN or an open endpoint). Vercel can't join a VPN by itself.
4. Whether store sales and POS receipts are in Pantheon, and whether web orders become orders or invoices there.
5. Who owns stock during a sync: a web sale must reach Pantheon before its next stock level overwrites ours.

A POS connects the same way, with its own `system` name, if it isn't already covered by Pantheon.

## Removing the confirmation page

`/admin/potvrda` is temporary. It lets the client check imported data, and any real edit confirms a product. Once the
dashboard shows every product confirmed, this is done by hand, because nothing is automated:

1. Delete `app/[locale]/admin/(panel)/potvrda/`, `features/catalog/review.ts`, `features/catalog/actions.ts`,
   `features/catalog/components/ProductReview.tsx` and `ReviewFilters.tsx`, and `tests/review.test.ts`.
2. Remove the link in `AdminShell`, the progress line in `Dashboard`, and the `review` texts in `messages/bs.json`.
3. Remove `reviewNote`, `confirmed`, `confirmedAt`, `confirmedBy` and their index from `Product`, and run
   `pnpm db:migrate:dev`. Remove the `confirmed: false` condition in `scripts/db-import.ts`.

If admin product screens exist by then, move the field rules from `review.ts` into them first.

## Deployment

See [deployment.md](deployment.md).
