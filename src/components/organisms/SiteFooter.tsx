export function SiteFooter() {
  return (
    <footer className="relative z-2 mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] px-8 pt-[26px] pb-[38px] max-[720px]:px-[22px] max-[460px]:flex-col max-[460px]:items-start max-[460px]:gap-2">
      <span className="font-ui text-xs tracking-[0.08em] text-[var(--text-muted)]">
        HELIKON d.o.o. · Sarajevo, Bosna i Hercegovina
      </span>
      <span className="font-ui text-xs tracking-[0.24em] text-[var(--text-muted)] uppercase">
        Pod okriljem muza
      </span>
    </footer>
  );
}
