import { useTranslations } from "next-intl";

type Props = { value: number; onChange: (value: number) => void; max: number };

export function QuantityStepper({ value, onChange, max }: Props) {
  const t = useTranslations("shop");
  const button =
    "h-full w-10 text-lg text-[var(--text-secondary)] hover:text-[var(--accent-bright)] disabled:opacity-30";
  return (
    <div className="inline-flex h-12 items-center rounded-[2px] border border-[var(--border-strong)]">
      <button
        type="button"
        aria-label={t("decrease")}
        className={button}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="w-8 text-center font-ui text-sm">
        <span className="sr-only">{t("quantity")}: </span>
        {value}
      </span>
      <button
        type="button"
        aria-label={t("increase")}
        className={button}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
