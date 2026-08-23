"use client";

import { useId, useState } from "react";
import { EmailField } from "../atoms/EmailField";
import { SubmitButton } from "../atoms/SubmitButton";
import { Caption } from "../atoms/Caption";
import { VisuallyHidden } from "../atoms/VisuallyHidden";

type Status = "idle" | "submitting" | "success" | "error";

export function SubscribeForm() {
  const emailId = useId();
  const honeypotId = useId();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: honeypot }),
      });
      const result = (await response.json()) as { ok: boolean };

      setStatus(response.ok && result.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p
        role="status"
        aria-live="polite"
        className="font-body text-lg text-[var(--accent-bright)]"
      >
        Zabilježeno. Javit ćemo se čim otvorimo vrata.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-wrap items-stretch gap-2.5 max-[720px]:flex-col">
        <EmailField
          id={emailId}
          value={email}
          onChange={setEmail}
          disabled={status === "submitting"}
        />
        <SubmitButton loading={status === "submitting"}>
          {status === "submitting" ? "Šalje se…" : "Obavijesti me"}
        </SubmitButton>
      </div>

      {/* Honeypot: invisible to sighted and screen-reader users, left empty by
          humans; a filled value marks the submission as spam. */}
      <div className="sr-only" aria-hidden="true">
        <VisuallyHidden as="label" htmlFor={honeypotId}>
          Ostavite ovo polje prazno
        </VisuallyHidden>
        <input
          id={honeypotId}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <Caption className="mt-3">
        Prijavom pristajete na primanje obavijesti. Vašu e-poštu ne dijelimo s trećim
        stranama.
      </Caption>

      <div aria-live="polite" role="status">
        {status === "error" && (
          <Caption tone="error" className="mt-2">
            Nešto je pošlo po zlu. Molimo pokušajte ponovo.
          </Caption>
        )}
      </div>
    </form>
  );
}
