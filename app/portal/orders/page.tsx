import type { Metadata } from "next";
import { PageHeading } from "@/components/app/PageHeading";
import { NsdaBadge, OrderBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/States";
import { IconBox } from "@/components/ui/Icons";
import { requireUserPage } from "@/lib/auth/guards";
import { ORDER_CATEGORIES, labelFor } from "@/lib/constants";
import { NSDA_MEMBERSHIP_INFO, paymentUrl } from "@/lib/integrations/myschoolbucks";
import { parseStringList } from "@/lib/json";
import { listActiveItems, listOwnOrders } from "@/lib/services/orders";
import { getSettings } from "@/lib/services/settings";
import { formatDate, formatMoney } from "@/lib/utils/format";
import { OrderForm } from "./OrderForm";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireUserPage("/portal/orders");

  const [items, orders, settings] = await Promise.all([listActiveItems(), listOwnOrders(user.id), getSettings()]);

  return (
    <>
      <PageHeading
        title="Orders"
      />

      <div className="mb-6">
        <Alert tone="info" title="How ordering works">
          Submitting a request tells officers you want the item. They confirm the order, tell you what to pay and where,
          and update the status as it moves along. No payment details are ever entered on this site.
        </Alert>
      </div>

      {/* NSDA membership gets its own card — it is an external purchase with
          a status the officer team verifies separately from an order. */}
      <Card className="mb-6">
        <CardHeader className="flex flex-wrap items-center justify-between gap-6">
          <CardTitle>NSDA membership</CardTitle>
          <NsdaBadge status={user.nsdaStatus} />
        </CardHeader>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-base leading-relaxed text-ink/60">
            National Speech &amp; Debate Association membership is needed to earn NSDA points and to enter
            NSDA-affiliated tournaments.{" "}
            {user.nsdaStatus === "ACTIVE"
              ? "Your membership is recorded as active."
              : "Once you have joined, an officer records it here."}
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={settings["links.myschoolbucks"]} size="sm" external>
              MySchoolBucks
            </ButtonLink>
            <ButtonLink href={NSDA_MEMBERSHIP_INFO} size="sm" variant="outline" external>
              About NSDA membership
            </ButtonLink>
          </div>
        </CardBody>
      </Card>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Available now</h2>
        {items.length === 0 ? (
          <EmptyState
            icon={<IconBox />}
            title="Nothing available at the moment"
            action={{ href: "/portal", label: "Back to dashboard" }}
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const sizes = parseStringList(item.sizes);
              return (
                <li key={item.id}>
                  <Card className="h-full">
                    <CardBody className="flex h-full flex-col gap-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-600">
                            {labelFor(ORDER_CATEGORIES, item.category)}
                          </p>
                          <h3 className="mt-1 font-display text-lg font-semibold text-ink">{item.name}</h3>
                        </div>
                        {item.priceCents ? (
                          <span className="shrink-0 font-display text-lg font-bold tabular-nums text-ink">
                            {formatMoney(item.priceCents)}
                          </span>
                        ) : null}
                      </div>

                      {item.description ? (
                        <p className="text-base leading-relaxed text-ink/60">{item.description}</p>
                      ) : null}

                      {sizes.length > 0 ? (
                        <p className="text-sm text-ink/60">Sizes: {sizes.join(", ")}</p>
                      ) : null}

                      <div className="mt-auto space-y-2 pt-2">
                        <OrderForm itemId={item.id} itemName={item.name} sizes={sizes} />
                        {item.externalUrl || item.externalLabel ? (
                          <ButtonLink
                            href={paymentUrl(item.externalUrl, settings["links.myschoolbucks"])}
                            size="sm"
                            variant="outline"
                            className="w-full"
                            external
                          >
                            {item.externalLabel ?? "Pay externally"}
                          </ButtonLink>
                        ) : null}
                      </div>
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Your orders</h2>
        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            className="py-8"
          />
        ) : (
          <Card>
            <CardBody className="p-0">
              <ul className="divide-y-2 divide-rule-faint">
                {orders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center gap-6 px-7 py-5">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-ink">
                        {order.quantity} × {order.item.name}
                        {order.size ? <span className="ml-2 text-sm font-normal text-ink/60">Size {order.size}</span> : null}
                      </p>
                      <p className="mt-1.5 text-sm text-ink/60">
                        Requested {formatDate(order.createdAt)}
                        {order.item.priceCents ? ` · ${formatMoney(order.item.priceCents * order.quantity)}` : ""}
                      </p>
                      {order.memberNote ? (
                        <p className="mt-1 text-sm italic text-ink/60">&ldquo;{order.memberNote}&rdquo;</p>
                      ) : null}
                    </div>
                    <OrderBadge status={order.status} />
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </section>
    </>
  );
}
