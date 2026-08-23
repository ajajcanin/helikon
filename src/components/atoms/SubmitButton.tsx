type SubmitButtonProps = {
  loading: boolean;
  children: React.ReactNode;
};

export function SubmitButton({ loading, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-12 flex-none items-center justify-center gap-2 whitespace-nowrap rounded-[2px] bg-[var(--accent)] px-6 font-ui text-sm font-semibold tracking-[0.08em] text-[var(--text-on-accent)] transition-colors duration-(--duration-base) ease-(--ease-out-soft) hover:bg-[var(--accent-bright)] hover:shadow-[var(--bloom-soft)] active:scale-[0.98] active:bg-[var(--accent-active)] disabled:cursor-not-allowed disabled:opacity-45 max-[720px]:w-full"
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 flex-none animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      <span>{children}</span>
    </button>
  );
}
