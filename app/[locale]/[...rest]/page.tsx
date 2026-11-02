import { notFound } from "next/navigation";

/** Sends every unknown URL to the translated not-found page. */
export default function CatchAll() {
  notFound();
}
