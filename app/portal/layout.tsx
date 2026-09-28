import type { Metadata } from "next";
import { AppShell, type NavGroup } from "@/components/app/AppShell";
import { ProfileSetupBanner } from "@/components/app/ProfileSetupBanner";
import {
  IconBook,
  IconBox,
  IconCalendar,
  IconForm,
  IconHome,
  IconNews,
  IconTicket,
  IconTrophy,
  IconUser,
  IconWallet,
} from "@/components/ui/Icons";
import { requireUserPage } from "@/lib/auth/guards";
import { countUnansweredForms } from "@/lib/services/forms";

export const metadata: Metadata = {
  title: { default: "Team portal", template: "%s · Team portal" },
  // Nothing behind sign-in should ever be indexed.
  robots: { index: false, follow: false, nocache: true },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/portal");
  const unansweredForms = await countUnansweredForms(user.id);

  const groups: NavGroup[] = [
    {
      items: [
        { href: "/portal", label: "Dashboard", icon: <IconHome /> },
        { href: "/portal/news", label: "News", icon: <IconNews /> },
        { href: "/portal/tournaments", label: "Tournaments", icon: <IconCalendar /> },
        { href: "/portal/registrations", label: "My registrations", icon: <IconTicket /> },
        { href: "/portal/forms", label: "Forms", icon: <IconForm />, badge: unansweredForms || undefined },
      ],
    },
    {
      heading: "My account",
      items: [
        { href: "/portal/dues", label: "Dues", icon: <IconWallet /> },
        { href: "/portal/orders", label: "Orders", icon: <IconBox /> },
        { href: "/portal/awards", label: "Awards", icon: <IconTrophy /> },
        { href: "/portal/profile", label: "Profile", icon: <IconUser /> },
      ],
    },
    {
      heading: "Team",
      items: [{ href: "/portal/resources", label: "Resources", icon: <IconBook /> }],
    },
  ];

  return (
    <AppShell
      groups={groups}
      area="portal"
      user={{ displayName: user.displayName, role: user.role, gradeNumber: user.gradeNumber }}
      crossLink={user.role === "OFFICER" ? { href: "/admin", label: "Officer dashboard" } : undefined}
    >
      <ProfileSetupBanner user={user} />
      {children}
    </AppShell>
  );
}
