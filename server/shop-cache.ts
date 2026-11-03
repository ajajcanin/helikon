import "server-only";
import { updateTag } from "next/cache";

/**
 * Labels on cached shop data. A change clears only the labels it affects.
 * Every shop page shows the menu and footer, so clearing `NAV` or `COMPANY` refreshes all of them.
 */
export const CATALOG = "catalog";
export const CONTENT = "content";
export const JOURNAL = "journal";
export const COMPANY = "company";
export const NAV = "nav";
export const productTag = (slug: string) => `product:${slug}`;

/** When an action doesn't say what it changes. Clearing too much is slower, but never wrong. */
export const EVERYTHING = [CATALOG, CONTENT, JOURNAL, COMPANY, NAV];

/**
 * For server actions, where the next visit must see the change. Anything else that writes shop data, such as a route
 * handler or a script, needs `revalidateTag(tag, "max")` instead.
 */
export function refreshShop(tags: readonly string[]) {
  for (const tag of new Set(tags)) updateTag(tag);
}
