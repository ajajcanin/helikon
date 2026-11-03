import { redirect } from "next/navigation";
import { param, type SearchParams } from "@/lib/search-params";

/** Search lives in the catalogue now. This keeps old links working. */
export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = param((await searchParams).q).trim();
  redirect(q ? `/proizvodi?q=${encodeURIComponent(q)}` : "/proizvodi?fokus=pretraga");
}
