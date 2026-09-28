import Link from "next/link";
import { IconAlert } from "@/components/ui/Icons";
import { listInEnglish, missingProfileFields, type ProfileCompletionInput } from "@/lib/services/profile-completion";

/**
 * Top-of-page prompt shown until a member's profile has everything officers
 * need. Rendered by both the portal and the officer dashboard layouts, since
 * officers are members too.
 *
 * A prompt rather than a gate: it names exactly what is missing and links to
 * the one page that fixes it, but never blocks the page underneath — a member
 * mid-way through registering for a tournament should not be bounced out.
 */
export function ProfileSetupBanner({ user }: { user: ProfileCompletionInput }) {
  const missing = missingProfileFields(user);
  if (missing.length === 0) return null;

  return (
    <div
      role="status"
      className="mb-12 flex flex-col gap-5 border-2 border-warn bg-warn-pale px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
    >
      <div className="flex gap-4">
        <IconAlert className="mt-0.5 h-6 w-6 shrink-0 text-warn" />
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-warn">
            Finish setting up your profile
          </p>
          <p className="mt-2 text-base leading-relaxed text-ink/80">
            Officers still need your {listInEnglish(missing.map((field) => field.label))}. News emails and tournament
            logistics depend on them.
          </p>
        </div>
      </div>
      <Link
        href="/portal/profile"
        className="inline-flex min-h-[48px] shrink-0 items-center justify-center border-2 border-ink bg-signal px-6 font-display text-xs font-bold uppercase tracking-[0.14em] text-paper transition-[transform,box-shadow] duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_0_var(--color-ink)] motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
      >
        Complete profile
      </Link>
    </div>
  );
}
