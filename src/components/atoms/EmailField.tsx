import { VisuallyHidden } from "./VisuallyHidden";

type EmailFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function EmailField({ id, value, onChange, disabled = false }: EmailFieldProps) {
  return (
    <div className="min-w-[180px] flex-[1_1_200px] max-[720px]:flex-none">
      <VisuallyHidden as="label" htmlFor={id}>
        Vaša e-pošta
      </VisuallyHidden>
      <input
        id={id}
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="vaša e-pošta"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-well)] px-3 font-ui text-sm text-[var(--text-display)] outline-none transition-colors duration-(--duration-base) ease-(--ease-out-soft) placeholder:text-[var(--text-muted)] hover:border-[var(--border-hover)] focus:border-[var(--accent)] focus:shadow-[var(--bloom-brass)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--border-strong)]"
      />
    </div>
  );
}
