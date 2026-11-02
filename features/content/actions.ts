"use server";

import { z } from "zod";
import { adminAction } from "@/server/admin/action";
import { actorOf } from "@/server/admin/session";
import { homeContentSchema } from "@/server/content";
import { createArticle, deleteArticle, saveHomeContent, savePageContent, updateArticle } from "./content";

export const saveHome = adminAction(homeContentSchema, async (input, user) => {
  await saveHomeContent(input, actorOf(user));
  return { data: undefined };
});

export const savePage = adminAction(
  z.object({ slug: z.string().max(40), title: z.string().max(120), body: z.string().max(50000) }),
  async ({ slug, ...input }, user) => {
    await savePageContent(slug, input, actorOf(user));
    return { data: undefined };
  },
);

const article = z.object({
  title: z.string().max(160),
  excerpt: z.string().max(400),
  body: z.string().max(50000),
  published: z.boolean(),
});

export const addArticle = adminAction(article, async (input, user) => {
  const created = await createArticle(input, actorOf(user));
  return { data: { id: created.id } };
});

export const editArticle = adminAction(
  article.extend({ id: z.number().int().positive() }),
  async ({ id, ...input }, user) => {
    await updateArticle(id, input, actorOf(user));
    return { data: undefined };
  },
);

export const removeArticle = adminAction(
  z.object({ id: z.number().int().positive() }),
  async ({ id }, user) => {
    await deleteArticle(id, actorOf(user));
    return { data: undefined };
  },
);
