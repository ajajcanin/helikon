import { StarMark } from "../atoms/StarMark";
import { Overline } from "../atoms/Overline";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <StarMark size="sm" alt="Helikon" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-semibold tracking-[0.18em] text-[var(--text-display)]">
          HELIKON
        </span>
        <Overline size="xs" className="mt-1">
          Kuća umjetničkih materijala
        </Overline>
      </span>
    </div>
  );
}
