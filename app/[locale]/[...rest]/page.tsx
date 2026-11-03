import { notFound } from "next/navigation";

/** Never reads the database, so it can be built once. */
export const dynamic = "force-static";

/** Sends every unknown URL to the translated not-found page. */
export default function CatchAll() {
  notFound();
}
