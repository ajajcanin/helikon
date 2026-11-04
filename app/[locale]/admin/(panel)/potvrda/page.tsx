import { getTranslations } from "next-intl/server";
import { ProductReview } from "@/features/catalog/components/ProductReview";
import { ReviewFilters } from "@/features/catalog/components/ReviewFilters";
import { listForReview, reviewOptions } from "@/features/catalog/review";
import { Link } from "@/i18n/navigation";

const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("review");
  const q = single(params.q);
  const status = single(params.status);
  const photo = single(params.slika);
  const categoryId = single(params.kategorija);
  const subcategoryId = single(params.podkategorija);
  const page = Math.max(1, Number(single(params.strana)) || 1);
  const [data, options] = await Promise.all([
    listForReview({
      q,
      status: status === "done" || status === "all" ? status : "open",
      categoryId: Number(subcategoryId) || Number(categoryId) || undefined,
      photo: photo === "nema" ? "missing" : photo === "ima" ? "present" : undefined,
      page,
    }),
    reviewOptions(),
  ]);
  const link = (to: number) => ({
    pathname: "/admin/potvrda",
    query: {
      ...(q && { q }),
      ...(status && { status }),
      ...(photo && { slika: photo }),
      ...(categoryId && { kategorija: categoryId }),
      ...(subcategoryId && { podkategorija: subcategoryId }),
      strana: to,
    },
  });

  return (
    <>
      <h1 className="font-display text-2xl tracking-[0.08em]">{t("title")}</h1>
      <p className="mt-2 mb-1 font-ui text-sm text-[var(--text-secondary)]">{t("intro")}</p>
      <p className="mb-6 font-ui text-sm text-[var(--accent-bright)]">
        {data.done} / {data.total}
      </p>
      <ReviewFilters
        q={q}
        status={status || "open"}
        photo={photo}
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        categoryTree={options.categoryTree}
      />
      {/* Keyed so changing page or filter starts from what the server holds. */}
      <ProductReview key={JSON.stringify(params)} rows={data.rows} options={options} />
      {data.pages > 1 && (
        <nav className="mt-6 flex items-center justify-between font-ui text-sm">
          {page > 1 ? <Link href={link(page - 1)}>{t("previous")}</Link> : <span />}
          <span className="text-[var(--text-muted)]">{t("page", { page, pages: data.pages })}</span>
          {page < data.pages ? <Link href={link(page + 1)}>{t("next")}</Link> : <span />}
        </nav>
      )}
    </>
  );
}
