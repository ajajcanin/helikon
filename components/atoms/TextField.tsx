import { useId } from "react";

type TextFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function TextField({ label, name, type = "text", value, onChange, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-ui text-xs tracking-[0.08em] text-[var(--text-secondary)]"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
        className="h-12 w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-well)] px-3 font-ui text-sm text-[var(--text-display)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
      />
    </div>
  );
}
