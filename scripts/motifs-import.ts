/**
 * pnpm db:motifs "<path to the .xlsx>" [--apply]
 *
 * Splits series sold under one šifra (rice papers, stencils) into motifs, from a sheet per series. Columns are found by
 * their headers: "Šifra Interna", "Šifra Pantheon" (on the series' first row), the maker's code or description
 * ("Šifra RICH" or "Opis Rich") and "Zaliha".
 * Each motif becomes a šifra of the series' product with its own stock and photo; the series' šifra stays only as the
 * motifs' šifra in the financial system, and its size moves to the product's specifications.
 * Without --apply it only reports what it would do.
 * Series already split are left alone, so it is safe to run again with a sheet that adds new series.
 */
import ExcelJS from "exceljs";
import { motifName } from "@/lib/motif-files";
import { audit, SYSTEM_ACTOR } from "@/server/audit";
import { db } from "@/server/db";

type Motif = { sku: string; series: string; name: string | null; stock: number };

const text = (value: ExcelJS.CellValue) =>
  value == null ? "" : String(typeof value === "object" && "result" in value ? value.result : value).trim();

async function readMotifs(path: string) {
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(path);
  const motifs: Motif[] = [];
  for (const sheet of book.worksheets) {
    // Empty header cells are holes in the row's values, so they are filled in first.
    const headers = Array.from(sheet.getRow(1).values as ExcelJS.CellValue[], (v) => text(v).toLowerCase());
    const column = (...names: string[]) => headers.findIndex((h) => names.some((n) => h.startsWith(n)));
    const [skuAt, seriesAt, nameAt, stockAt] = [
      column("šifra interna"),
      column("šifra pantheon"),
      column("šifra rich", "opis rich"),
      column("zaliha"),
    ];
    if ([skuAt, seriesAt, nameAt, stockAt].includes(-1))
      throw new Error(
        `${sheet.name}: nedostaje kolona Šifra Interna, Šifra Pantheon, Šifra/Opis Rich ili Zaliha.`,
      );
    let series = "";
    const found: Motif[] = [];
    sheet.eachRow((row, i) => {
      if (i === 1) return;
      const sku = text(row.getCell(skuAt).value);
      if (!sku) return;
      series = text(row.getCell(seriesAt).value) || series;
      const stock = Number(text(row.getCell(stockAt).value));
      if (!series || !Number.isInteger(stock) || stock < 0)
        throw new Error(`${sheet.name}, red ${i}: nedostaje šifra serije ili zaliha nije broj.`);
      found.push({ sku, series, name: motifName(text(row.getCell(nameAt).value)) || null, stock });
    });
    // A name every motif shares tells them apart no better than none: the šifra shows instead.
    const names = found.map((m) => m.name);
    for (const m of found) if (names.filter((n) => n === m.name).length > 1) m.name = null;
    motifs.push(...found);
  }
  return motifs;
}

const findSeries = (sku: string) =>
  db.productVariant.findUnique({
    where: { sku },
    include: { product: { select: { id: true, name: true, specs: true } }, cost: true },
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
    const unnamed = items.filter((m) => !m.name).length;
    console.log(
      `${code} ${series.product.name}: ${items.length} motiva, ${series.price} KM, npr. ${items
        .slice(0, 3)
        .map((m) => `${m.sku} ${m.name ?? "(bez naziva)"}`)
        .join(", ")}${unnamed ? `, bez naziva: ${unnamed}` : ""}${note}`,
    );
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
        // The series' size was on its šifra; the motifs take names, so the size moves to the specifications.
        const specs = Array.isArray(series.product.specs)
          ? (series.product.specs as { label: string; value: string }[])
          : [];
        const size =
          series.size && !specs.some((s) => s.label === "Dimenzije")
            ? [...specs, { label: "Dimenzije", value: series.size }]
            : undefined;
        await tx.product.update({
          where: { id: series.productId },
          data: { variantKind: "MOTIF", ...(size && { specs: size }) },
        });
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
