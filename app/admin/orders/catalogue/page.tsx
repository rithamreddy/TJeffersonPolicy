import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Alert } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { parseStringList } from "@/lib/json";
import { listAllItems } from "@/lib/services/orders";
import { CatalogueEditor } from "./CatalogueEditor";

export const metadata: Metadata = { title: "Order catalogue" };

export default async function CataloguePage() {
  await requireOfficerPage("/admin/orders/catalogue");
  const rows = await listAllItems();

  const items = rows.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    category: item.category,
    externalUrl: item.externalUrl,
    externalLabel: item.externalLabel,
    sizes: parseStringList(item.sizes),
    isActive: item.isActive,
    sortOrder: item.sortOrder,
  }));

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← Orders
      </Link>

      <PageHeading
        title="Order catalogue"
      />

      <div className="mb-5">
        <Alert tone="info">
          Items are requests, not purchases. Members pay through the payment link you set here (or wherever you tell
          them), and you move the order through its statuses as it is fulfilled.
        </Alert>
      </div>

      <CatalogueEditor items={items} />
    </>
  );
}
