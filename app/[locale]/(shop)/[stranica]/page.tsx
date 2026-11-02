import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlainText } from "@/lib/plain-text";
import { CONTENT_PAGES, getPageContent } from "@/server/content";

type Props = { params: Promise<{ stranica: string }> };

async function load(slug: string) {
  const page = CONTENT_PAGES.find((p) => p.slug === slug);
  if (!page) return null;
  const content = await getPageContent(slug);
  return content.body?.trim() ? { title: content.title?.trim() || page.label, body: content.body } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load((await params).stranica);
  return page ? { title: `${page.title} · Helikon` } : {};
}

export default async function ContentPage({ params }: Props) {
  const page = await load((await params).stranica);
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-[760px] px-6 pt-12 pb-[88px]">
      <h1 className="mb-8 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] uppercase md:text-[42px]">
        {page.title}
      </h1>
      <PlainText text={page.body} />
    </div>
  );
}
