import { EmptyState } from "@/components/ui/States";
import { PageHeading } from "@/components/app/PageHeading";

export default function AdminNotFound() {
  return (
    <>
      <PageHeading title="Not found" />
      <EmptyState
        title="We could not find that"
        action={{ href: "/admin", label: "Back to the dashboard" }}
      />
    </>
  );
}
