"use server";

import { z } from "zod";
import { adminAction, UserError } from "@/server/admin/action";
import { actorOf } from "@/server/admin/session";
import { FEATURED_MAX } from "@/server/content";
import { saveFeatured, searchFeaturedCandidates, topProducts } from "./featured";

export const findFeaturedCandidates = adminAction(z.object({ q: z.string().max(100) }), async ({ q }) => ({
  data: await searchFeaturedCandidates(q),
}));

export const saveFeaturedOrder = adminAction(
  z.object({ ids: z.array(z.number().int().positive()).max(FEATURED_MAX) }),
  async ({ ids }, user) => ({ data: await saveFeatured(ids, actorOf(user)) }),
);

export const fillFeatured = adminAction(
  z.object({ by: z.enum(["sold", "profit"]), count: z.number().int().min(1).max(FEATURED_MAX) }),
  async ({ by, count }, user) => {
    // Profit rests on purchase prices, which only administrators see.
    if (by === "profit" && user.role !== "ADMINISTRATOR") throw new UserError("Nemate pravo za ovu radnju.");
    const top = await topProducts(by, count);
    return {
      data: top.length
        ? await saveFeatured(
            top.map((r) => r.id),
            actorOf(user),
          )
        : [],
    };
  },
);
