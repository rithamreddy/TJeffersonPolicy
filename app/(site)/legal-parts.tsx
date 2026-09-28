/**
 * Shared furniture for the privacy and terms pages.
 *
 * Legal copy is the one place on this site where a long, unbroken column of
 * running text is correct — so it gets a measure capped near 68 characters, a
 * numbered rule between sections, and nothing else competing for attention.
 *
 * `LEGAL_LAST_UPDATED` is a constant rather than a build timestamp: "last
 * updated" must mean "someone last revised this wording", and wiring it to the
 * build clock would silently claim a review every time the site redeploys.
 * Change it by hand when the text changes.
 */
export const LEGAL_LAST_UPDATED = "28 September 2026";

export function LegalBody({ children }: { children: React.ReactNode }) {
  return <div className="legal max-w-[68ch]">{children}</div>;
}

export function LegalUpdated() {
  return (
    <p className="mb-14 inline-flex items-center gap-4 border-2 border-rule px-5 py-3 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ink/70">
      <span className="h-2 w-2 bg-signal" aria-hidden="true" />
      Last updated {LEGAL_LAST_UPDATED}
    </p>
  );
}

/** One clause of the document. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="legal-section">
      <h2 className="t-h3 mb-6 mt-16 text-ink first:mt-0">{title}</h2>
      {children}
    </section>
  );
}
