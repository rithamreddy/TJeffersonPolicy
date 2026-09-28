import type { Metadata } from "next";
import { AppShell, type NavGroup } from "@/components/app/AppShell";
import { ProfileSetupBanner } from "@/components/app/ProfileSetupBanner";
import {
  IconBook,
  IconBox,
  IconCalendar,
  IconChart,
  IconClipboard,
  IconForm,
  IconHome,
  IconNews,
  IconSettings,
  IconShield,
  IconTicket,
  IconUsers,
  IconWallet,
} from "@/components/ui/Icons";
import { requireOfficerPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: { default: "Officer dashboard", template: "%s · Officer dashboard" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Officer area.
 *
 * Authorization is enforced here, in every route handler under /api/admin, and
 * again in each page — the sidebar simply reflects a decision already made
 * server-side.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOfficerPage("/admin");

  // A single count so the sidebar can show what actually needs attention.
  const pendingRegistrations = await prisma.tournamentRegistration.count({ where: { status: "PENDING" } });

  const groups: NavGroup[] = [
    {
      items: [
        { href: "/admin", label: "Dashboard", icon: <IconHome /> },
        { href: "/admin/members", label: "Members", icon: <IconUsers /> },
      ],
    },
    {
      heading: "Competition",
      items: [
        { href: "/admin/tournaments", label: "Tournaments", icon: <IconCalendar /> },
        {
          href: "/admin/registrations",
          label: "Registrations",
          icon: <IconTicket />,
          badge: pendingRegistrations || undefined,
        },
      ],
    },
    {
      heading: "Operations",
      items: [
        { href: "/admin/dues", label: "Dues", icon: <IconWallet /> },
        { href: "/admin/orders", label: "Orders", icon: <IconBox /> },
      ],
    },
    {
      heading: "Content",
      items: [
        { href: "/admin/news", label: "News", icon: <IconNews /> },
        { href: "/admin/forms", label: "Forms", icon: <IconForm /> },
        { href: "/admin/resources", label: "Resources", icon: <IconBook /> },
        { href: "/admin/officers", label: "Officer team", icon: <IconClipboard /> },
        { href: "/admin/settings", label: "Club settings", icon: <IconSettings /> },
      ],
    },
    {
      heading: "Oversight",
      items: [
        { href: "/admin/analytics", label: "Analytics", icon: <IconChart /> },
        { href: "/admin/audit", label: "Audit log", icon: <IconShield /> },
      ],
    },
  ];

  return (
    <AppShell
      groups={groups}
      area="admin"
      user={{ displayName: user.displayName, role: user.role, gradeNumber: user.gradeNumber }}
      crossLink={{ href: "/portal", label: "My member portal" }}
    >
      {/* Officers are members too, and need the same details on file. */}
      <ProfileSetupBanner user={user} />
      {children}
    </AppShell>
  );
}
