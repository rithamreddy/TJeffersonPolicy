"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";

export function DismissChecklistButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function dismiss() {
    setBusy(true);
    try {
      await api.post("/api/onboarding", { action: "checklist-dismissed" });
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={dismiss}
      disabled={busy}
      className="min-h-[44px] px-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ink/55 underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
    >
      {busy ? "Hiding…" : "Hide checklist"}
    </button>
  );
}
