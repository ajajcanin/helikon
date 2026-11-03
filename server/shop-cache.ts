import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Drops every cached shop page, so the next visit reads current data. Called after anything a customer can see changes.
 * Writes are rare enough that refreshing everything stays cheap, and no page can be missed.
 */
export const refreshShop = () => revalidatePath("/", "layout");
