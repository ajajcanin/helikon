import { slugify } from "@/lib/slug";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { db } from "@/server/db";

export async function listManufacturers() {
  const rows = await db.manufacturer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
      lines: { orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } },
    },
  });
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    products: m._count.products,
    lines: m.lines.map((l) => ({ id: l.id, name: l.name, products: l._count.products })),
  }));
}

export type ManufacturerNode = Awaited<ReturnType<typeof listManufacturers>>[number];

function cleanName(raw: string) {
  const name = raw.trim();
  if (name.length < 2) throw new UserError("Naziv je prekratak.");
  return name;
}

export async function createManufacturer(rawName: string, actor: AuditActor) {
  const name = cleanName(rawName);
  await db.$transaction(async (tx) => {
    if (await tx.manufacturer.findFirst({ where: { name: { equals: name, mode: "insensitive" } } })) {
      throw new UserError("Taj proizvođač već postoji.");
    }
    const created = await tx.manufacturer.create({ data: { name, slug: slugify(name) } });
    await audit(tx, actor, {
      action: "create",
      table: "manufacturer",
      recordId: created.id,
      summary: `Novi proizvođač: ${name}`,
    });
  });
}

export async function renameManufacturer(id: number, rawName: string, actor: AuditActor) {
  const name = cleanName(rawName);
  await db.$transaction(async (tx) => {
    const before = await tx.manufacturer.findUnique({ where: { id } });
    if (!before) throw new UserError("Proizvođač ne postoji.");
    if (before.name === name) return;
    if (
      await tx.manufacturer.findFirst({
        where: { name: { equals: name, mode: "insensitive" }, id: { not: id } },
      })
    ) {
      throw new UserError("Taj proizvođač već postoji.");
    }
    await tx.manufacturer.update({ where: { id }, data: { name } });
    await audit(tx, actor, {
      action: "update",
      table: "manufacturer",
      recordId: id,
      summary: `Proizvođač ${before.name} → ${name}`,
      changes: { name: [before.name, name] },
    });
  });
}

export async function deleteManufacturer(id: number, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const found = await tx.manufacturer.findUnique({
      where: { id },
      include: { _count: { select: { products: true, lines: true } } },
    });
    if (!found) throw new UserError("Proizvođač ne postoji.");
    if (found._count.products > 0)
      throw new UserError(`Proizvođača koristi ${found._count.products} artikala. Prvo ih promijenite.`);
    if (found._count.lines > 0) throw new UserError("Proizvođač ima linije. Prvo ih obrišite.");
    await tx.manufacturer.delete({ where: { id } });
    await audit(tx, actor, {
      action: "delete",
      table: "manufacturer",
      recordId: id,
      summary: `Obrisan proizvođač: ${found.name}`,
    });
  });
}

export async function createLine(manufacturerId: number, rawName: string, actor: AuditActor) {
  const name = cleanName(rawName);
  await db.$transaction(async (tx) => {
    const maker = await tx.manufacturer.findUnique({ where: { id: manufacturerId } });
    if (!maker) throw new UserError("Proizvođač ne postoji.");
    if (
      await tx.manufacturerLine.findFirst({
        where: { manufacturerId, name: { equals: name, mode: "insensitive" } },
      })
    ) {
      throw new UserError("Ta linija već postoji.");
    }
    const line = await tx.manufacturerLine.create({ data: { manufacturerId, name } });
    await audit(tx, actor, {
      action: "create",
      table: "manufacturer",
      recordId: maker.id,
      summary: `Nova linija: ${maker.name} > ${name} (${line.id})`,
    });
  });
}

export async function renameLine(id: number, rawName: string, actor: AuditActor) {
  const name = cleanName(rawName);
  await db.$transaction(async (tx) => {
    const before = await tx.manufacturerLine.findUnique({ where: { id } });
    if (!before) throw new UserError("Linija ne postoji.");
    if (before.name === name) return;
    const taken = await tx.manufacturerLine.findFirst({
      where: {
        manufacturerId: before.manufacturerId,
        name: { equals: name, mode: "insensitive" },
        id: { not: id },
      },
    });
    if (taken) throw new UserError("Ta linija već postoji.");
    await tx.manufacturerLine.update({ where: { id }, data: { name } });
    await audit(tx, actor, {
      action: "update",
      table: "manufacturer",
      recordId: before.manufacturerId,
      summary: `Linija ${before.name} → ${name}`,
      changes: { line: [before.name, name] },
    });
  });
}

export async function deleteLine(id: number, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const line = await tx.manufacturerLine.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!line) throw new UserError("Linija ne postoji.");
    if (line._count.products > 0)
      throw new UserError(`Liniju koristi ${line._count.products} artikala. Prvo ih promijenite.`);
    await tx.manufacturerLine.delete({ where: { id } });
    await audit(tx, actor, {
      action: "delete",
      table: "manufacturer",
      recordId: line.manufacturerId,
      summary: `Obrisana linija: ${line.name}`,
    });
  });
}
