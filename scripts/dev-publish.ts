/**
 * pnpm db:dev-publish
 * Local preview only: publishes every product and adds sample delivery rates, so the shop has something to show.
 * Refuses any database that isn't on this computer.
 */
import "dotenv/config";
import { db } from "@/server/db";

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  if (host !== "localhost" && host !== "127.0.0.1")
    throw new Error(`Samo za lokalnu bazu, a ovo je ${host}.`);
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
