/**
 * pnpm db:import "<path to the .xlsx>" [--dry-run] [--reclassify]
 * Imports the supplier sheet. Safe to run again: matches by šifra, updates prices and costs, and moves stock only by
 * the difference. New products start as DRAFT: nothing is public until staff review it and add photos.
 * --reclassify re-applies classify.ts and product-details.ts to existing products, except confirmed ones.
 */
import "dotenv/config";
import { Decimal } from "decimal.js";
import ExcelJS from "exceljs";
import { classifyProduct, FALLBACK_CATEGORY, namesColour } from "@/features/catalog/classify";
import { cellValue, parseSheetName, parseSheetNumber } from "@/features/catalog/parse-sheet";
import { productDetails } from "@/features/catalog/product-details";
import { slugify } from "@/lib/slug";
import { audit, SYSTEM_ACTOR } from "@/server/audit";
import { db } from "@/server/db";

// purchaseUsd is the price after the 15% rabat (column E), which is what the KM cost is calculated from.
const COLUMNS = {
  sku: 1,
  name: 2,
  qty: 3,
  purchaseUsd: 5,
  purchaseKm: 8,
  margin: 12,
  price: 13,
  lineTotal: 14,
};

type Row = {
  sku: string;
  line: string;
  product: string;
  size: string | null;
  qty: number;
  price: string;
  purchaseUsd: string | null;
  purchaseKm: string | null;
  margin: string | null;
};

async function readSheet(path: string) {
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(path);
  const sheet = book.worksheets[0]!;
  const rows: Row[] = [];
  const problems: string[] = [];
  const flags = new Map<string, string>();
  sheet.eachRow((r, i) => {
    if (i === 1) return;
    const cell = (c: number) => cellValue(r.getCell(c).value);
    const sku = cell(COLUMNS.sku);
    if (sku == null || sku === "") return; // the totals rows at the bottom
    const name = String(cell(COLUMNS.name) ?? "");
    const price = parseSheetNumber(cell(COLUMNS.price));
    const qty = parseSheetNumber(cell(COLUMNS.qty));
    if (!name || !price || !qty || !Number.isInteger(Number(qty))) {
      problems.push(`Red ${i} (šifra ${sku}): naziv, cijena ili količina nije ispravna`);
      return;
    }
    const lineTotal = parseSheetNumber(cell(COLUMNS.lineTotal));
    if (
      lineTotal &&
      new Decimal(price)
        .times(qty)
        .minus(lineTotal)
        .abs()
        .greaterThan(new Decimal(lineTotal).times(0.02).plus(1))
    ) {
      const problem = `Provjeriti cijenu, šifra ${sku}: ${qty} × ${price} nije ${lineTotal}.`;
      problems.push(`${problem} (${name})`);
      flags.set(String(sku), problem);
    }
    rows.push({
      sku: String(sku),
      ...parseSheetName(name),
      qty: Number(qty),
      price: new Decimal(price).toDecimalPlaces(2).toString(),
      purchaseUsd: parseSheetNumber(cell(COLUMNS.purchaseUsd)),
      purchaseKm: parseSheetNumber(cell(COLUMNS.purchaseKm)),
      margin: parseSheetNumber(cell(COLUMNS.margin)),
    });
  });
  return { rows, problems, flags };
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('Upotreba: pnpm db:import "<putanja do .xlsx>" [--dry-run]');
  const { rows, problems, flags } = await readSheet(path);

  const products = new Map<string, Row[]>();
  // Grouped by slug: the sheet spells some products two ways ("White - Bijela", "White - bijela").
  for (const r of rows) products.set(slugify(r.product), [...(products.get(slugify(r.product)) ?? []), r]);
  const multi = [...products.values()].filter((v) => v.length > 1);
  const duplicates = multi.filter((v) => new Set(v.map((r) => r.size)).size < v.length);

  console.log(`Artikala: ${rows.length}, proizvoda: ${products.size}, sa više veličina: ${multi.length}`);
  const classified = [...products.values()].map((v) => ({
    name: v[0]!.product,
    ...classifyProduct(v[0]!.product),
  }));
  const fallback = classified.filter((c) => c.top === FALLBACK_CATEGORY.top);
  console.log(
    `Kategorija: ${new Set(classified.map((c) => c.top)).size}, potkategorija: ${new Set(classified.map((c) => c.sub)).size}, bez veličine: ${rows.filter((r) => !r.size).length}`,
  );
  for (const c of fallback) console.log(`  Bez kategorije: ${c.name}`);
  for (const c of classified) {
    if (!c.colourFamily && namesColour(c.name, c.top)) console.log(`  Bez porodice boje: ${c.name}`);
  }
  for (const d of duplicates)
    console.log(
      `  Provjeriti, ista veličina više puta: ${d[0]!.product} (${d.map((r) => r.sku).join(", ")})`,
    );
  for (const p of problems) console.log(`  ${p}`);
  if (process.argv.includes("--dry-run")) return;
  const reclassify = process.argv.includes("--reclassify");

  const stats = await db.$transaction(
    async (tx) => {
      let created = 0;
      let updated = 0;
      for (const [slug, variants] of products) {
        const info = classifyProduct(variants[0]!.product);
        const top = await tx.category.upsert({
          where: { slug: slugify(info.top) },
          create: { slug: slugify(info.top), name: info.top, sort: info.sort },
          update: {},
        });
        const category = info.sub
          ? await tx.category.upsert({
              where: { slug: slugify(info.sub) },
              create: { slug: slugify(info.sub), name: info.sub, parentId: top.id, sort: info.sort },
              update: reclassify ? { parentId: top.id, sort: info.sort } : {},
            })
          : top;
        const details = productDetails(variants[0]!.product);
        const manufacturer = details.manufacturer
          ? await tx.manufacturer.upsert({
              where: { slug: slugify(details.manufacturer) },
              create: { slug: slugify(details.manufacturer), name: details.manufacturer },
              update: {},
            })
          : null;
        const line =
          manufacturer && details.line
            ? await tx.manufacturerLine.upsert({
                where: { manufacturerId_name: { manufacturerId: manufacturer.id, name: details.line } },
                create: { manufacturerId: manufacturer.id, name: details.line },
                update: {},
              })
            : null;
        const flagged = variants.flatMap((r) => flags.get(r.sku) ?? []);
        const sorted = {
          categoryId: category.id,
          manufacturerId: manufacturer?.id ?? null,
          lineId: line?.id ?? null,
          medium: info.medium,
          colourFamily: info.colourFamily,
          finish: details.finish,
          description: details.description,
          specs: details.specs ?? undefined,
          colourName: details.colourName,
          colourNameMaker: details.colourNameMaker,
          colourCode: details.colourCode,
          reviewNote: [details.reviewNote, ...flagged].join(" "),
        };
        const product = await tx.product.upsert({
          where: { slug },
          create: { slug, name: variants[0]!.product, ...sorted },
          update: {},
        });
        // A normal import keeps what staff corrected by hand, and nothing touches a confirmed product.
        if (reclassify)
          await tx.product.updateMany({ where: { id: product.id, confirmed: false }, data: sorted });
        for (const [sort, r] of variants.entries()) {
          const before = await tx.productVariant.findUnique({ where: { sku: r.sku } });
          const variant = await tx.productVariant.upsert({
            where: { sku: r.sku },
            create: {
              sku: r.sku,
              productId: product.id,
              size: r.size,
              price: r.price,
              stockQty: r.qty,
              sort,
            },
            update: { productId: product.id, size: r.size, price: r.price, stockQty: r.qty, sort },
          });
          const cost = { purchaseUsd: r.purchaseUsd, purchaseKm: r.purchaseKm, margin: r.margin };
          await tx.variantCost.upsert({
            where: { variantId: variant.id },
            create: { variantId: variant.id, ...cost },
            update: cost,
          });
          const delta = r.qty - (before?.stockQty ?? 0);
          if (delta !== 0) {
            await tx.stockMovement.create({ data: { variantId: variant.id, delta, reason: "IMPORT" } });
          }
          if (before) updated++;
          else created++;
        }
      }
      // Drafts left without variants when a corrected name moved them to another product.
      await tx.product.deleteMany({ where: { status: "DRAFT", variants: { none: {} } } });
      if (reclassify) {
        await tx.category.deleteMany({ where: { parentId: { not: null }, products: { none: {} } } });
        await tx.category.deleteMany({ where: { products: { none: {} }, children: { none: {} } } });
      }
      await audit(tx, SYSTEM_ACTOR, {
        action: "import",
        table: "product_variant",
        summary: `Uvoz cjenovnika: ${created} novih, ${updated} ažuriranih`,
        changes: { created, updated },
      });
      return { created, updated };
    },
    { timeout: 300_000 },
  );
  console.log(`Gotovo: ${stats.created} novih, ${stats.updated} ažuriranih.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
