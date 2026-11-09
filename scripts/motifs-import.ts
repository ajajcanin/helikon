/**
 * pnpm db:motifs "<path to the .xlsx>" [--apply]
 *
 * Splits series sold under one šifra (rice papers, stencils) into motifs, from a sheet per series with columns
 * A: internal šifra, B: the series' šifra in the financial system (on its first row), C: the maker's description, E: stock.
 * Each motif becomes a šifra of the series' product with its own stock and photo; the series' šifra stays only as the
 * motifs' šifra in the financial system. Without --apply it only reports what it would do.
 * Series already split are left alone, so it is safe to run again with a sheet that adds new series.
 */
import ExcelJS from "exceljs";
import { motifName } from "@/lib/motif-files";
import { audit, SYSTEM_ACTOR } from "@/server/audit";
import { db } from "@/server/db";

type Motif = { sku: string; series: string; name: string; stock: number };

const text = (value: ExcelJS.CellValue) =>
  value == null ? "" : String(typeof value === "object" && "result" in value ? value.result : value).trim();

async function readMotifs(path: string) {
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(path);
  const motifs: Motif[] = [];
  for (const sheet of book.worksheets) {
    let series = "";
    sheet.eachRow((row, i) => {
      if (i === 1) return;
      const sku = text(row.getCell(1).value);
      if (!sku) return;
      series = text(row.getCell(2).value) || series;
      const stock = Number(text(row.getCell(5).value));
      if (!series || !Number.isInteger(stock) || stock < 0)
        throw new Error(`${sheet.name}, red ${i}: nedostaje šifra serije ili zaliha nije broj.`);
      motifs.push({ sku, series, name: motifName(text(row.getCell(3).value)), stock });
    });
  }
  return motifs;
}

const findSeries = (sku: string) =>
  db.productVariant.findUnique({
    where: { sku },
    include: { product: { select: { id: true, name: true } }, cost: true },
  });

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('Upotreba: pnpm db:motifs "<putanja do .xlsx>" [--apply]');
  const motifs = await readMotifs(path);
  const bySeries = Map.groupBy(motifs, (m) => m.series);

  const plan: { series: NonNullable<Awaited<ReturnType<typeof findSeries>>>; items: Motif[] }[] = [];
  for (const [code, items] of bySeries) {
    if (await db.productVariant.findFirst({ where: { externalId: code } })) {
      console.log(`${code}: već podijeljena na motive, preskačem.`);
      continue;
    }
    const series = await findSeries(code);
    if (!series) {
      console.log(`${code}: nema artikla s tom šifrom, preskačem.`);
      continue;
    }
    const total = items.reduce((sum, m) => sum + m.stock, 0);
    const note =
      total === series.stockQty ? "" : `  ZALIHA SE NE SLAŽE: serija ${series.stockQty}, motivi ${total}`;
    console.log(`${code} ${series.product.name}: ${items.length} motiva, ${series.price} KM${note}`);
    if (note) continue;
    plan.push({ series, items });
  }

  const taken = await db.productVariant.findMany({
    where: { sku: { in: plan.flatMap((p) => p.items.map((m) => m.sku)) } },
    select: { sku: true },
  });
  const renamed = new Set(plan.map((p) => p.series.sku));
  const clashes = taken.filter((t) => !renamed.has(t.sku)).map((t) => t.sku);
  if (clashes.length > 0) throw new Error(`Šifre motiva već postoje kao druge šifre: ${clashes.join(", ")}`);
  if (!process.argv.includes("--apply")) {
    console.log(`\nProba: ništa nije promijenjeno. Za upis dodajte --apply.`);
    return;
  }

  await db.$transaction(
    async (tx) => {
      // Series first: some motifs take a šifra that another series used until now.
      for (const { series } of plan) {
        await tx.productVariant.update({
          where: { id: series.id },
          data: { sku: `${series.sku}-serija`, active: false, stockQty: 0 },
        });
        if (series.stockQty > 0)
          await tx.stockMovement.create({
            data: {
              variantId: series.id,
              delta: -series.stockQty,
              reason: "ADJUSTMENT",
              note: "Zaliha prebačena na motive",
            },
          });
      }
      for (const { series, items } of plan) {
        for (const [sort, m] of items.entries()) {
          const variant = await tx.productVariant.create({
            data: {
              productId: series.productId,
              sku: m.sku,
              externalId: series.sku,
              size: m.name,
              price: series.price,
              taxRate: series.taxRate,
              stockQty: m.stock,
              sort,
              ...(series.cost && {
                cost: {
                  create: {
                    purchaseUsd: series.cost.purchaseUsd,
                    purchaseKm: series.cost.purchaseKm,
                    margin: series.cost.margin,
                  },
                },
              }),
            },
          });
          if (m.stock > 0)
            await tx.stockMovement.create({
              data: { variantId: variant.id, delta: m.stock, reason: "IMPORT" },
            });
        }
        await tx.product.update({ where: { id: series.productId }, data: { variantKind: "MOTIF" } });
        await audit(tx, SYSTEM_ACTOR, {
          action: "import",
          table: "product",
          recordId: series.productId,
          summary: `Serija ${series.sku} podijeljena na ${items.length} motiva`,
          changes: { motifs: items.map((m) => m.sku) },
        });
      }
    },
    { timeout: 300_000 },
  );
  console.log(`\nGotovo: ${plan.length} serija, ${plan.reduce((n, p) => n + p.items.length, 0)} motiva.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
