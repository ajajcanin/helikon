import { slugify } from "@/lib/slug";
import { UserError } from "@/server/admin/action";
import { type AuditActor, audit } from "@/server/audit";
import { db, type Tx } from "@/server/db";

/** Two levels: top categories and their subcategories, each with how many products use it. */
export async function listCategoryTree() {
  const rows = await db.category.findMany({
    where: { parentId: null },
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    include: {
      _count: { select: { products: true } },
      children: {
        orderBy: [{ sort: "asc" }, { id: "asc" }],
        include: { _count: { select: { products: true } } },
      },
    },
  });
  return rows.map((top) => ({
    id: top.id,
    name: top.name,
    products: top._count.products,
    total: top._count.products + top.children.reduce((sum, c) => sum + c._count.products, 0),
    children: top.children.map((c) => ({ id: c.id, name: c.name, products: c._count.products })),
  }));
}

export type CategoryNode = Awaited<ReturnType<typeof listCategoryTree>>[number];

function cleanName(raw: string) {
  const name = raw.trim();
  if (name.length < 2) throw new UserError("Naziv je prekratak.");
  return name;
}

async function uniqueSlug(tx: Tx, name: string) {
  const base = slugify(name);
  if (!base) throw new UserError("Naziv mora imati slova ili brojeve.");
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await tx.category.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

async function requireTop(tx: Tx, id: number) {
  const parent = await tx.category.findUnique({ where: { id }, select: { parentId: true } });
  if (!parent) throw new UserError("Nadređena kategorija ne postoji.");
  if (parent.parentId !== null) throw new UserError("Potkategorija ne može imati svoje potkategorije.");
}

export async function createCategory(input: { name: string; parentId: number | null }, actor: AuditActor) {
  const name = cleanName(input.name);
  return db.$transaction(async (tx) => {
    if (input.parentId !== null) await requireTop(tx, input.parentId);
    const last = await tx.category.aggregate({ where: { parentId: input.parentId }, _max: { sort: true } });
    const category = await tx.category.create({
      data: {
        name,
        slug: await uniqueSlug(tx, name),
        parentId: input.parentId,
        sort: (last._max.sort ?? 0) + 1,
      },
    });
    await audit(tx, actor, {
      action: "create",
      table: "category",
      recordId: category.id,
      summary: `Nova kategorija: ${name}`,
    });
    return category;
  });
}

/** Renaming keeps the slug, so links to the category keep working. */
export async function renameCategory(id: number, rawName: string, actor: AuditActor) {
  const name = cleanName(rawName);
  await db.$transaction(async (tx) => {
    const before = await tx.category.findUnique({ where: { id } });
    if (!before) throw new UserError("Kategorija ne postoji.");
    if (before.name === name) return;
    await tx.category.update({ where: { id }, data: { name } });
    await audit(tx, actor, {
      action: "update",
      table: "category",
      recordId: id,
      summary: `Kategorija ${before.name} → ${name}`,
      changes: { name: [before.name, name] },
    });
  });
}

/** Moves a category under another top category, or makes it a top category itself. */
export async function moveCategory(id: number, parentId: number | null, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const before = await tx.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true } } },
    });
    if (!before) throw new UserError("Kategorija ne postoji.");
    if (before.parentId === parentId) return;
    if (parentId !== null) {
      if (parentId === id) throw new UserError("Kategorija ne može biti unutar same sebe.");
      if (before._count.children > 0) throw new UserError("Prvo premjestite njene potkategorije.");
      await requireTop(tx, parentId);
    }
    const last = await tx.category.aggregate({ where: { parentId }, _max: { sort: true } });
    await tx.category.update({ where: { id }, data: { parentId, sort: (last._max.sort ?? 0) + 1 } });
    await audit(tx, actor, {
      action: "update",
      table: "category",
      recordId: id,
      summary: `Kategorija ${before.name} premještena`,
      changes: { parentId: [before.parentId, parentId] },
    });
  });
}

/** Swaps with the neighbour, renumbering first because imported categories can share sort numbers. */
export async function shiftCategory(id: number, direction: "up" | "down", actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const current = await tx.category.findUnique({ where: { id } });
    if (!current) throw new UserError("Kategorija ne postoji.");
    const siblings = await tx.category.findMany({
      where: { parentId: current.parentId },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    const from = siblings.findIndex((s) => s.id === id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= siblings.length) return;
    const order = siblings.map((s) => s.id);
    [order[from], order[to]] = [order[to]!, order[from]!];
    for (const [sort, siblingId] of order.entries()) {
      await tx.category.update({ where: { id: siblingId }, data: { sort } });
    }
    await audit(tx, actor, {
      action: "update",
      table: "category",
      recordId: id,
      summary: `Promijenjen redoslijed: ${current.name}`,
    });
  });
}

/** Only empty categories can go, so no product ever loses its place by accident. */
export async function deleteCategory(id: number, actor: AuditActor) {
  await db.$transaction(async (tx) => {
    const category = await tx.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) throw new UserError("Kategorija ne postoji.");
    if (category._count.children > 0)
      throw new UserError("Kategorija ima potkategorije. Prvo ih obrišite ili premjestite.");
    if (category._count.products > 0) {
      throw new UserError(`Kategorija ima ${category._count.products} artikala. Prvo ih premjestite.`);
    }
    await tx.category.delete({ where: { id } });
    await audit(tx, actor, {
      action: "delete",
      table: "category",
      recordId: id,
      summary: `Obrisana kategorija: ${category.name}`,
    });
  });
}
