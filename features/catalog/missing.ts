import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { reviewInclude, toReviewRow } from "./review";

const PAGE_SIZE = 20;

/** What a product can lack, each a tab on the page for completing products. */
export const MISSING_TABS = [
  "opis",
  "specifikacija",
  "slika",
  "proizvodjac",
  "linija",
  "boja",
  "nijansa",
  "motivi",
  "sakriveno",
] as const;
export type MissingTab = (typeof MISSING_TABS)[number];

const published = { status: "PUBLISHED" } as const;

function missingWhere(tab: MissingTab): Prisma.ProductWhereInput {
  switch (tab) {
    case "opis":
      return { ...published, OR: [{ description: null }, { description: "" }] };
    case "specifikacija":
      return {
        ...published,
        OR: [
          { specs: { equals: Prisma.DbNull } },
          { specs: { equals: Prisma.JsonNull } },
          { specs: { equals: [] } },
        ],
      };
    case "slika":
      // A series of motifs needs a photo of each motif it sells.
      return {
        ...published,
        OR: [
          { variantKind: "SIZE", photos: { none: {} } },
          {
            variantKind: "MOTIF",
            variants: { some: { active: true, externalId: { not: null }, photos: { none: {} } } },
          },
        ],
      };
    case "proizvodjac":
      return { ...published, manufacturerId: null };
    case "linija":
      // Only where the maker has lines to choose from: a brush of a maker without lines lacks nothing.
      return { ...published, lineId: null, manufacturer: { lines: { some: {} } } };
    case "boja":
      // A colour without a family is missing from the shop's colour filter.
      return { ...published, colourName: { not: null }, colourFamily: null };
    case "nijansa":
      // Customers search by shade number, so a colour without one is hard to find.
      return { ...published, colourName: { not: null }, OR: [{ colourCode: null }, { colourCode: "" }] };
    case "motivi":
      // A motif without a name shows only its šifra to customers.
      return {
        ...published,
        variantKind: "MOTIF",
        variants: { some: { active: true, externalId: { not: null }, size: null } },
      };
    case "sakriveno":
      // A series' old šifra was set aside when it was split into motifs, so it isn't something hidden by hand.
      return {
        OR: [
          { status: { not: "PUBLISHED" } },
          { variants: { some: { active: false, NOT: { sku: { endsWith: "-serija" } } } } },
        ],
      };
  }
}

/** How many products each tab has, for the tabs and the dashboard. */
export async function missingCounts() {
  const counts = await Promise.all(MISSING_TABS.map((tab) => db.product.count({ where: missingWhere(tab) })));
  return Object.fromEntries(MISSING_TABS.map((tab, i) => [tab, counts[i]!])) as Record<MissingTab, number>;
}

export async function listMissing({
  tab,
  q,
  categoryId,
  page = 1,
}: {
  tab: MissingTab;
  q?: string;
  categoryId?: number;
  page?: number;
}) {
  const search = q?.trim();
  const where: Prisma.ProductWhereInput = {
    AND: [
      missingWhere(tab),
      ...(categoryId ? [{ OR: [{ categoryId }, { category: { parentId: categoryId } }] }] : []),
      ...(search
        ? [
            {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { colourName: { contains: search, mode: "insensitive" as const } },
                { variants: { some: { sku: { contains: search } } } },
              ],
            },
          ]
        : []),
    ],
  };
  const [rows, filtered] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ category: { sort: "asc" } }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: reviewInclude,
    }),
    db.product.count({ where }),
  ]);
  return { rows: rows.map(toReviewRow), filtered, pages: Math.max(1, Math.ceil(filtered / PAGE_SIZE)) };
}
