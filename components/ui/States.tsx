import { cn } from "@/lib/utils/cn";
import { ButtonLink } from "./Button";

/**
 * The five states every data view must handle. Having them as shared
 * components is what stops a page from shipping a blank div when a list
 * happens to be empty.
 */

export function EmptyState({
  title,
  action,
  icon,
  className,
}: {
  title: string;
  action?: { href: string; label: string; external?: boolean };
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden border-2 border-rule bg-paper-raised px-8 py-16 text-center", className)}>
      {/* A hatched band along the top marks the frame as deliberately empty
          rather than broken. */}
      <div className="c-hatch absolute inset-x-0 top-0 h-2 opacity-30" aria-hidden="true" />
      {icon ? (
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border-2 border-rule bg-signal text-paper">
          {icon}
        </div>
      ) : null}
      <p className="t-h3">{title}</p>
      {action ? (
        <div className="mt-8">
          <ButtonLink href={action.href} external={action.external} size="sm" variant="outline">
            {action.label}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, retry }: { title?: string; description?: string; retry?: React.ReactNode }) {
  return (
    <div role="alert" className="border-2 border-bad bg-bad-pale px-8 py-12 text-center">
      <p className="t-h3 text-bad">{title}</p>
      {description ? <p className="mx-auto mt-4 max-w-md text-base text-bad/85">{description}</p> : null}
      {retry ? <div className="mt-8">{retry}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-paper-sunk", className)} aria-hidden="true" />;
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/**
 * Alerts are bordered blocks with a heavy left rule in the tone colour —
 * closer to a printed notice than a rounded toast.
 */
export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "good" | "warn" | "bad";
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-navy-600 bg-navy-100 text-navy-900",
    good: "border-good bg-good-pale text-good",
    warn: "border-warn bg-warn-pale text-warn",
    bad: "border-bad bg-bad-pale text-bad",
  } as const;

  return (
    <div
      role={tone === "bad" ? "alert" : "status"}
      className={cn("border-2 border-l-8 px-6 py-5 text-base leading-relaxed", tones[tone])}
    >
      {title ? <p className="font-display text-sm font-bold uppercase tracking-[0.12em]">{title}</p> : null}
      <div className={title ? "mt-2" : undefined}>{children}</div>
    </div>
  );
}
