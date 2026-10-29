import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { FilterBar } from "@/components/app/FilterBar";
import { InlineStatus } from "@/components/app/InlineStatus";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { ORDER_CATEGORIES, ORDER_STATUSES, labelFor } from "@/lib/constants";
import { parseStringList } from "@/lib/json";
import { listAllItems, listOrdersForOfficers } from "@/lib/services/orders";
import { formatDate, formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Orders" };

interface PageProps {
  searchParams: Promise<{ status?: string; itemId?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireOfficerPage("/admin/orders");
  const filters = await searchParams;

  const [orders, items] = await Promise.all([
    listOrdersForOfficers({ status: filters.status, itemId: filters.itemId }),
    listAllItems(),
  ]);

  const exportQuery = new URLSearchParams();
  if (filters.status) exportQuery.set("status", filters.status);
  if (filters.itemId) exportQuery.set("itemId", filters.itemId);

  return (
    <>
      <PageHeading
        title="Orders"
      />

      <FilterBar
        selects={[
          { name: "status", label: "Any status", options: Object.entries(ORDER_STATUSES).map(([value, label]) => ({ value, label })) },
          { name: "itemId", label: "All items", options: items.map((item) => ({ value: item.id, label: item.name })) },
        ]}
        actions={
          <ButtonLink href={`/api/admin/orders/export?${exportQuery.toString()}`} size="sm" variant="outline" external>
            Export CSV
          </ButtonLink>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders match"
        />
      ) : (
        <TableWrap label="Orders" className="mb-8">
          <Table className="min-w-[720px]">
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>Item</Th>
                <Th>Qty</Th>
                <Th>Size</Th>
                <Th>Ordered</Th>
                <Th className="w-44">Status</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <Tr key={order.id}>
                  <Td>
                    <Link href={`/admin/members/${order.userId}`} className="text-sm font-semibold text-ink hover:text-navy-600">
                      {order.user.displayName}
                    </Link>
                    {order.memberNote ? (
                      <span className="mt-1.5 block text-sm italic text-ink/60">&ldquo;{order.memberNote}&rdquo;</span>
                    ) : null}
                  </Td>
                  <Td className="text-ink/60">{order.item.name}</Td>
                  <Td className="tabular-nums">{order.quantity}</Td>
                  <Td className="text-ink/60">{order.size ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-ink/60">{formatDate(order.createdAt)}</Td>
                  <Td>
                    <InlineStatus
                      endpoint={`/api/admin/orders/${order.id}`}
                      value={order.status}
                      options={ORDER_STATUSES}
                      label={`Status for ${order.user.displayName}'s order`}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-6">
          <CardTitle>Catalogue</CardTitle>
          <ButtonLink href="/admin/orders/catalogue" size="sm" variant="outline">
            Manage catalogue
          </ButtonLink>
        </CardHeader>
        <CardBody className={items.length === 0 ? undefined : "p-0"}>
          {items.length === 0 ? (
            <EmptyState
              title="No items yet"
              action={{ href: "/admin/orders/catalogue", label: "Add an item" }}
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <ul className="divide-y-2 divide-rule-faint">
              {items.map((item) => {
                const sizes = parseStringList(item.sizes);
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-6 px-7 py-5">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-ink">{item.name}</p>
                      <p className="mt-1.5 text-sm text-ink/60">
                        {labelFor(ORDER_CATEGORIES, item.category)}
                        {item.priceCents ? ` · ${formatMoney(item.priceCents)}` : " · no price set"}
                        {sizes.length > 0 ? ` · ${sizes.length} sizes` : ""}
                      </p>
                    </div>
                    <Badge tone={item.isActive ? "good" : "neutral"}>{item.isActive ? "Available" : "Hidden"}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
