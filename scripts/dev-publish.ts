/**
 * pnpm db:dev-publish
 * Development only: publishes every product and adds sample delivery rates, so the shop has something to show.
 * Refuses anything but a local database or the Neon development branch.
 */
import { db } from "@/server/db";

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  const isDevelopment =
    host === "localhost" || host === "127.0.0.1" || process.env.NEON_BRANCH === "development";
  if (!isDevelopment) throw new Error(`Samo za razvojnu bazu, a ovo je ${host}.`);
  const { count } = await db.product.updateMany({
    where: { status: "DRAFT" },
    data: { status: "PUBLISHED" },
  });
  if ((await db.deliveryRate.count()) === 0) {
    await db.deliveryRate.createMany({
      data: [
        { name: "Brza pošta (primjer)", price: "8.00", freeFrom: "100.00", sort: 1 },
        { name: "Preuzimanje u radnji", price: "0.00", sort: 2 },
      ],
    });
  }
  console.log(`Objavljeno ${count} artikala.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
