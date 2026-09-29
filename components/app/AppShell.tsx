"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/client/api";
import { cn } from "@/lib/utils/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Optional count badge, e.g. pending registrations awaiting an officer. */
  badge?: number;
}

export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

/**
 * Shell for the two authenticated areas.
 *
 * The dashboard carries the same constructivist language as the public site,
 * but inverted: navigation is a solid navy column — the 30% structural colour —
 * against the paper working area, with signal red reserved for the active
 * item and nothing else. Work happens on paper; structure is navy.
 */
export function AppShell({
  groups,
  user,
  area,
  crossLink,
  children,
}: {
  groups: NavGroup[];
  user: { displayName: string; role: string; gradeNumber: number | null };
  area: "portal" | "admin";
  crossLink?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  async function signOut() {
    setSigningOut(true);
    try {
      await api.post("/api/auth/logout");
      router.push("/");
      router.refresh();
    } catch {
      // Even if the request fails the safest thing is to leave the app; the
      // cookie is cleared server-side either way on the next request.
      router.replace("/");
    }
  }

  const nav = (
    <nav
      aria-label={area === "admin" ? "Officer dashboard" : "Team portal"}
      className="flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto px-5 py-8"
    >
      {groups.map((group, index) => (
        <div key={group.heading ?? index}>
          {group.heading ? (
            <h2 className="mb-4 flex items-center gap-3 font-display text-[10px] font-extrabold uppercase tracking-[0.22em] text-signal-bright">
              <span className="h-0.5 w-5 bg-signal" aria-hidden="true" />
              {group.heading}
            </h2>
          ) : null}
          <ul>
            {group.items.map((item) => {
              const active =
                pathname === item.href || (item.href !== `/${area}` && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    // Lets the onboarding tour find and highlight this item
                    // without the shell needing to know the tour exists.
                    data-nav-href={item.href}
                    className={cn(
                      "flex min-h-[48px] items-center gap-3.5 border-l-4 px-4 font-display text-[13px] font-bold uppercase tracking-[0.08em] transition-colors",
                      active
                        ? "border-signal bg-white/10 text-white"
                        : "border-transparent text-white/60 hover:border-white/30 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <span className="shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "px-2 py-1 text-[10px] font-extrabold tabular-nums",
                          active ? "bg-signal text-paper" : "bg-white/15 text-white",
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {crossLink ? (
        <div className="mt-auto border-t-2 border-white/15 pt-6">
          <Link
            href={crossLink.href}
            onClick={() => setMobileOpen(false)}
            className="flex min-h-[48px] items-center gap-3 px-4 font-display text-[13px] font-bold uppercase tracking-[0.08em] text-signal-bright transition-colors hover:bg-white/5"
          >
            <span aria-hidden="true">⇄</span>
            {crossLink.label}
          </Link>
        </div>
      ) : null}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar — fixed on desktop, off-canvas on small screens. */}
      <aside data-app-sidebar className="on-dark fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-navy-900 lg:flex">
        <div className="c-grid-texture pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <SidebarHeader area={area} />
          {nav}
          <UserFooter user={user} onSignOut={signOut} signingOut={signingOut} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="on-dark sticky top-0 z-30 flex h-16 items-center gap-4 bg-navy-900 px-5 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
          className="flex h-11 w-11 items-center justify-center border-2 border-white/25 text-white hover:bg-white/10"
        >
          <span className="sr-only">Open navigation</span>
          <span aria-hidden="true" className="text-lg">
            ☰
          </span>
        </button>
        <Link href={`/${area}`} className="flex items-center gap-3">
          <Image src="/brand/logo.svg" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-display text-xs font-bold uppercase tracking-[0.16em] text-white">
            {area === "admin" ? "Officer dashboard" : "Team portal"}
          </span>
        </Link>
        <div className="ml-auto">
          <Avatar name={user.displayName} size="sm" />
        </div>
        <div className="c-rule-signal absolute inset-x-0 bottom-0" aria-hidden="true" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 h-full w-full bg-navy-950/70"
          />
          <div
            id="app-sidebar"
            className="on-dark absolute inset-y-0 left-0 flex w-80 max-w-[88vw] flex-col border-r-4 border-signal bg-navy-900"
          >
            <div className="flex items-center justify-between border-b-2 border-white/15 px-5 py-4">
              <SidebarHeader area={area} bare />
              <button
                ref={closeRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center border-2 border-white/25 text-white hover:bg-white/10"
              >
                <span className="sr-only">Close navigation</span>
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            {nav}
            <UserFooter user={user} onSignOut={signOut} signingOut={signingOut} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <main id="main" className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarHeader({ area, bare = false }: { area: "portal" | "admin"; bare?: boolean }) {
  return (
    <Link
      href={`/${area}`}
      className={cn("flex items-center gap-3.5", !bare && "border-b-2 border-white/15 px-5 py-6")}
    >
      <Image src="/brand/logo.svg" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
      <span className="min-w-0">
        <span className="block truncate font-display text-[13px] font-extrabold uppercase tracking-[0.12em] text-white">
          TJ Policy Debate
        </span>
        <span className="mt-1 block font-display text-[10px] font-bold uppercase tracking-[0.2em] text-signal-bright">
          {area === "admin" ? "Officer dashboard" : "Team portal"}
        </span>
      </span>
    </Link>
  );
}

function UserFooter({
  user,
  onSignOut,
  signingOut,
}: {
  user: { displayName: string; role: string; gradeNumber: number | null };
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <div className="border-t-2 border-white/15 p-5">
      <div className="flex items-center gap-3.5">
        <Avatar name={user.displayName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[13px] font-bold uppercase tracking-[0.06em] text-white">
            {user.displayName}
          </p>
          <p className="mt-1 truncate font-display text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
            {user.role === "OFFICER" ? "Officer" : "Member"}
            {user.gradeNumber ? ` · Grade ${user.gradeNumber}` : ""}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className="mt-5 min-h-[44px] w-full border-2 border-white/25 px-4 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-white hover:bg-white hover:text-navy-900 disabled:opacity-50"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
