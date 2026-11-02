"use server";

import { z } from "zod";
import { adminAction } from "@/server/admin/action";
import { actorOf } from "@/server/admin/session";
import { createCategory, deleteCategory, moveCategory, renameCategory, shiftCategory } from "./categories";
import {
  createLine,
  createManufacturer,
  deleteLine,
  deleteManufacturer,
  renameLine,
  renameManufacturer,
} from "./manufacturers";
import { adjustStock, setProductStatus } from "./products";
import { confirmProducts, REVIEW_FIELDS, updateReviewField, updateVariantField } from "./review";

export const saveReviewField = adminAction(
  z.object({ id: z.number().int().positive(), field: z.enum(REVIEW_FIELDS), value: z.string().max(5000) }),
  async ({ id, field, value }, user) => ({ data: await updateReviewField(id, field, value, actorOf(user)) }),
);

export const saveVariantField = adminAction(
  z.object({ id: z.number().int().positive(), field: z.enum(["size", "price"]), value: z.string().max(40) }),
  async ({ id, field, value }, user) => ({
    data: await updateVariantField(id, { field, value }, actorOf(user)),
  }),
);

export const confirmReview = adminAction(
  z.object({ ids: z.array(z.number().int().positive()).min(1).max(200) }),
  async ({ ids }, user) => ({ data: await confirmProducts(ids, actorOf(user)) }),
);

const id = z.number().int().positive();

export const addCategory = adminAction(
  z.object({ name: z.string().max(80), parentId: id.nullable() }),
  async (input, user) => {
    await createCategory(input, actorOf(user));
    return { data: undefined };
  },
);

export const editCategoryName = adminAction(
  z.object({ id, name: z.string().max(80) }),
  async ({ id, name }, user) => {
    await renameCategory(id, name, actorOf(user));
    return { data: undefined };
  },
);

export const editCategoryParent = adminAction(
  z.object({ id, parentId: id.nullable() }),
  async ({ id, parentId }, user) => {
    await moveCategory(id, parentId, actorOf(user));
    return { data: undefined };
  },
);

export const editCategoryOrder = adminAction(
  z.object({ id, direction: z.enum(["up", "down"]) }),
  async ({ id, direction }, user) => {
    await shiftCategory(id, direction, actorOf(user));
    return { data: undefined };
  },
);

export const removeCategory = adminAction(z.object({ id }), async ({ id }, user) => {
  await deleteCategory(id, actorOf(user));
  return { data: undefined };
});

export const addManufacturer = adminAction(z.object({ name: z.string().max(80) }), async ({ name }, user) => {
  await createManufacturer(name, actorOf(user));
  return { data: undefined };
});

export const editManufacturer = adminAction(
  z.object({ id, name: z.string().max(80) }),
  async ({ id, name }, user) => {
    await renameManufacturer(id, name, actorOf(user));
    return { data: undefined };
  },
);

export const removeManufacturer = adminAction(z.object({ id }), async ({ id }, user) => {
  await deleteManufacturer(id, actorOf(user));
  return { data: undefined };
});

export const addLine = adminAction(
  z.object({ manufacturerId: id, name: z.string().max(80) }),
  async ({ manufacturerId, name }, user) => {
    await createLine(manufacturerId, name, actorOf(user));
    return { data: undefined };
  },
);

export const editLine = adminAction(
  z.object({ id, name: z.string().max(80) }),
  async ({ id, name }, user) => {
    await renameLine(id, name, actorOf(user));
    return { data: undefined };
  },
);

export const removeLine = adminAction(z.object({ id }), async ({ id }, user) => {
  await deleteLine(id, actorOf(user));
  return { data: undefined };
});

export const changeProductStatus = adminAction(
  z.object({ id, status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) }),
  async ({ id, status }, user) => {
    await setProductStatus(id, status, actorOf(user));
    return { data: undefined };
  },
);

export const changeStock = adminAction(
  z.object({ id, qty: z.number(), note: z.string().max(200) }),
  async ({ id, qty, note }, user) => {
    await adjustStock(id, qty, note, actorOf(user));
    return { data: undefined };
  },
);
