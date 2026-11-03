import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PlainText } from "@/lib/plain-text";
import interior from "@/public/images/shop-interior.png";
import { CONTENT_PAGES, type ContentPageSlug } from "@/server/content";
import { cachedPageContent } from "@/server/public/cached";

async function load(slug: ContentPageSlug) {
  const page = CONTENT_PAGES.find((p) => p.slug === slug);
  if (!page) return null;
  const content = await cachedPageContent(slug);
  return content.body?.trim() ? { title: content.title?.trim() || page.label, body: content.body } : null;
}

export async function contentMetadata(slug: ContentPageSlug): Promise<Metadata> {
  const page = await load(slug);
  return page ? { title: `${page.title} · Helikon` } : {};
}

/** A page staff write in the admin. It stays hidden until it has text. */
export async function ContentPage({ slug }: { slug: ContentPageSlug }) {
  const page = await load(slug);
  if (!page) notFound();
  if (slug === "o-nama") return <AboutPage title={page.title} body={page.body} />;
  return (
    <div className="mx-auto max-w-[760px] px-6 pt-12 pb-[88px]">
      <h1 className="mb-8 font-display text-[32px] font-semibold tracking-[0.05em] text-[var(--text-display)] uppercase md:text-[44px]">
        {page.title}
      </h1>
      <PlainText text={page.body} />
    </div>
  );
}

async function AboutPage({ title, body }: { title: string; body: string }) {
  const t = await getTranslations("shop");
  return (
    <>
      <section className="relative h-[300px] overflow-hidden border-b border-[var(--border-subtle)] md:h-[420px]">
        <Image
          src={interior}
          alt={t("interiorAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[color-mix(in_srgb,var(--bg-page)_55%,transparent)] to-transparent" />
        <div className="absolute inset-x-0 bottom-9 px-6 text-center">
          <span className="hk-eyebrow">{t("about")}</span>
          <h1 className="mt-3 font-display text-[32px] font-semibold tracking-[0.06em] text-[var(--text-display)] uppercase md:text-5xl">
            {title}
          </h1>
        </div>
      </section>
      <div className="mx-auto max-w-[720px] px-6 pt-14 pb-[88px]">
        <PlainText text={body} lede />
        <Link
          href="/kontakt"
          className="mt-10 inline-flex h-12 items-center rounded-[2px] border border-[var(--border-brass)] px-6 font-ui text-sm tracking-[0.08em] text-[var(--accent-bright)] transition-colors hover:bg-[var(--accent-subtle)]"
        >
          {t("heroVisit")}
        </Link>
      </div>
    </>
  );
}
