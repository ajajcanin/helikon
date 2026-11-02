/**
 * pnpm user:create
 * Creates an admin user from the terminal (the very first Administrator). Nothing is exposed on the web.
 * Non-interactive: pnpm user:create --name "Ime" --email a@b.ba --password "…" --role ADMINISTRATOR
 */
import { randomUUID } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { z } from "zod";
import { audit, SYSTEM_ACTOR } from "@/server/audit";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const ask = async (q: string, def?: string) =>
    (
      arg(q.split(" ")[0]!.toLowerCase()) ??
      ((await rl.question(`${q}${def ? ` [${def}]` : ""}: `)) || def || "")
    ).trim();
  const name = arg("name") ?? (await ask("Ime i prezime"));
  const email = (arg("email") ?? (await ask("E-mail"))).toLowerCase();
  const password = arg("password") ?? (await ask("Lozinka (najmanje 10 znakova)"));
  const roleRaw = (
    arg("role") ?? (await ask("Uloga (ADMINISTRATOR / UREDNIK)", "ADMINISTRATOR"))
  ).toUpperCase();
  rl.close();

  const data = z
    .object({
      name: z.string().min(2),
      email: z.email(),
      password: z.string().min(10, "Lozinka mora imati najmanje 10 znakova"),
      role: z.enum(["ADMINISTRATOR", "UREDNIK"]),
    })
    .parse({ name, email, password, role: roleRaw });

  if (await db.user.findUnique({ where: { email: data.email } })) {
    console.error(`Korisnik ${data.email} već postoji.`);
    process.exit(1);
  }
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(data.password);
  const id = randomUUID();
  await db.$transaction(async (tx) => {
    await tx.user.create({
      data: { id, name: data.name, email: data.email, emailVerified: true, role: data.role },
    });
    await tx.account.create({
      data: { id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash },
    });
    await audit(tx, SYSTEM_ACTOR, {
      action: "create",
      table: "user",
      recordId: id,
      summary: `Korisnik ${data.name} (${data.role}) kreiran iz terminala`,
    });
  });
  console.log(`✔ Korisnik ${data.name} <${data.email}> (${data.role}) je kreiran. Prijava: /admin/prijava`);
}

main()
  .catch((e) => {
    console.error(e instanceof z.ZodError ? e.issues.map((i) => i.message).join("\n") : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
