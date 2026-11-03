import { Fragment } from "react";

/**
 * Text staff type into a form, as page content: "## " starts a heading, "- " a list item, a blank line a new paragraph.
 * React escapes everything, so nothing typed can run as code. With `lede`, a first paragraph is set larger as an intro.
 */
export function PlainText({ text, lede = false }: { text: string; lede?: boolean }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="flex flex-col gap-4 font-body text-lg leading-relaxed text-[var(--text-secondary)]">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((line) => line.trim());
        const key = `${i}-${lines[0]}`;
        if (lines[0]?.startsWith("## ")) {
          return (
            <Fragment key={key}>
              <h2 className="mt-4 font-display text-2xl font-medium tracking-[0.04em] text-[var(--text-display)]">
                {lines[0].slice(3)}
              </h2>
              {lines.length > 1 && <p>{lines.slice(1).join(" ")}</p>}
            </Fragment>
          );
        }
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={key} className="list-disc pl-6">
              {lines.map((line) => (
                <li key={line}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={key} className={lede && i === 0 ? "text-[22px] italic" : undefined}>
            {lines.join(" ")}
          </p>
        );
      })}
    </div>
  );
}
