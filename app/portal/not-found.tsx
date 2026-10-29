import { EmptyState } from "@/components/ui/States";
import { PageHeading } from "@/components/app/PageHeading";

export default function PortalNotFound() {
  return (
    <>
      <PageHeading title="Not found" />
      <EmptyState
        title="We could not find that"
        action={{ href: "/portal", label: "Back to your dashboard" }}
      />
    </>
  );
}
