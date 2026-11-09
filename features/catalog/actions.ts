"use server";

import { z } from "zod";
import { adminAction, SHOP_UNCHANGED } from "@/server/admin/action";
import { actorOf } from "@/server/admin/session";
import { CATALOG, NAV } from "@/server/shop-cache";
import { finishUpload, requestUpload } from "@/server/uploads";
import { createCategory, deleteCategory, moveCategory, renameCategory, shiftCategory } from "./categories";
import {
  createLine,
  createManufacturer,
  deleteLine,
  deleteManufacturer,
  renameLine,
  renameManufacturer,
} from "./manufacturers";
import { addPhoto, deletePhoto, photoName, replacePhoto } from "./photos";
import { adjustStock, recordStoreSale, setProductStatus } from "./products";
import {
  confirmProducts,
  REVIEW_FIELDS,
  unconfirmProduct,
  updateReviewField,
  updateVariantField,
} from "./review";

/** Can move products between categories or hide them, which changes the menu. */
const catalogAction: typeof adminAction = (schema, handler, opts) =>
  adminAction(schema, handler, { refresh: [CATALOG, NAV], ...opts });

/** Changes one product's details: the menu stays as it is. */
const productAction: typeof adminAction = (schema, handler, opts) =>
  adminAction(schema, handler, { refresh: [CATALOG], ...opts });

export const saveReviewField = catalogAction(
  z.object({ id: z.number().int().positive(), field: z.enum(REVIEW_FIELDS), value: z.string().max(5000) }),
  async ({ id, field, value }, user) => ({ data: await updateReviewField(id, field, value, actorOf(user)) }),
);

export const saveVariantField = productAction(
  z.object({ id: z.number().int().positive(), field: z.enum(["size", "price"]), value: z.string().max(40) }),
  async ({ id, field, value }, user) => ({
    data: await updateVariantField(id, { field, value }, actorOf(user)),
  }),
);

// Being confirmed shows only in the admin, so the shop stays cached.
export const confirmReview = adminAction(
  z.object({ ids: z.array(z.number().int().positive()).min(1).max(200) }),
  async ({ ids }, user) => ({ data: await confirmProducts(ids, actorOf(user)) }),
  SHOP_UNCHANGED,
);

export const unconfirmReview = adminAction(
  z.object({ id: z.number().int().positive() }),
  async ({ id }, user) => ({ data: await unconfirmProduct(id, actorOf(user)) }),
  SHOP_UNCHANGED,
);

const id = z.number().int().positive();

export const addCategory = catalogAction(
  z.object({ name: z.string().max(80), parentId: id.nullable() }),
  async (input, user) => {
    await createCategory(input, actorOf(user));
    return { data: undefined };
  },
);

export const editCategoryName = catalogAction(
  z.object({ id, name: z.string().max(80) }),
  async ({ id, name }, user) => {
    await renameCategory(id, name, actorOf(user));
    return { data: undefined };
  },
);

export const editCategoryParent = catalogAction(
  z.object({ id, parentId: id.nullable() }),
  async ({ id, parentId }, user) => {
    await moveCategory(id, parentId, actorOf(user));
    return { data: undefined };
  },
);

export const editCategoryOrder = catalogAction(
  z.object({ id, direction: z.enum(["up", "down"]) }),
  async ({ id, direction }, user) => {
    await shiftCategory(id, direction, actorOf(user));
    return { data: undefined };
  },
);

export const removeCategory = catalogAction(z.object({ id }), async ({ id }, user) => {
  await deleteCategory(id, actorOf(user));
  return { data: undefined };
});

export const addManufacturer = catalogAction(
  z.object({ name: z.string().max(80) }),
  async ({ name }, user) => {
    await createManufacturer(name, actorOf(user));
    return { data: undefined };
  },
);

export const editManufacturer = catalogAction(
  z.object({ id, name: z.string().max(80) }),
  async ({ id, name }, user) => {
    await renameManufacturer(id, name, actorOf(user));
    return { data: undefined };
  },
);

export const removeManufacturer = catalogAction(z.object({ id }), async ({ id }, user) => {
  await deleteManufacturer(id, actorOf(user));
  return { data: undefined };
});

export const addLine = catalogAction(
  z.object({ manufacturerId: id, name: z.string().max(80) }),
  async ({ manufacturerId, name }, user) => {
    await createLine(manufacturerId, name, actorOf(user));
    return { data: undefined };
  },
);

export const editLine = catalogAction(
  z.object({ id, name: z.string().max(80) }),
  async ({ id, name }, user) => {
    await renameLine(id, name, actorOf(user));
    return { data: undefined };
  },
);

export const removeLine = catalogAction(z.object({ id }), async ({ id }, user) => {
  await deleteLine(id, actorOf(user));
  return { data: undefined };
});

export const changeProductStatus = catalogAction(
  z.object({ id, status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) }),
  async ({ id, status }, user) => {
    await setProductStatus(id, status, actorOf(user));
    return { data: undefined };
  },
);

export const changeStock = productAction(
  z.object({ id, qty: z.number(), note: z.string().max(200) }),
  async ({ id, qty, note }, user) => {
    await adjustStock(id, qty, note, actorOf(user));
    return { data: undefined };
  },
);

export const storeSale = productAction(z.object({ id }), async ({ id }, user) => {
  await recordStoreSale(id, actorOf(user));
  return { data: undefined };
});

export const requestProductPhoto = catalogAction(
  z.object({ contentType: z.string().max(40), size: z.number().int().positive() }),
  async (input) => ({ data: await requestUpload(input) }),
  SHOP_UNCHANGED,
);

export const finishProductPhoto = productAction(
  z.object({ productId: id, key: z.string().max(80), variantId: id.optional() }),
  async ({ productId, key, variantId }, user) => {
    const image = await finishUpload(key, "products", await photoName(productId, { variantId }));
    await addPhoto(productId, image, actorOf(user), variantId);
    return { data: undefined };
  },
);

export const replaceProductPhoto = productAction(
  z.object({ id, productId: id, key: z.string().max(80) }),
  async ({ id, productId, key }, user) => {
    const image = await finishUpload(key, "products", await photoName(productId, { photoId: id }));
    await replacePhoto(id, productId, image, actorOf(user));
    return { data: undefined };
  },
);

export const removePhoto = productAction(z.object({ id }), async ({ id }, user) => {
  await deletePhoto(id, actorOf(user));
  return { data: undefined };
});
