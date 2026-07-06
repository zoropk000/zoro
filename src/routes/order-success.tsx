import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { formatPKR } from "@/lib/currency";
import { getOrders, type SavedOrder } from "@/lib/orders";
import { siteConfig } from "@/config/siteConfig";
import { CheckCircle2, MessageCircle } from "lucide-react";

const searchSchema = z.object({ order: z.string().optional() });

export const Route = createFileRoute("/order-success")({
  head: () => ({ meta: [{ title: "Order Placed - StepStyle Pakistan" }] }),
  validateSearch: searchSchema,
  component: SuccessPage,
});

function SuccessPage() {
  const { order: orderNumber } = Route.useSearch();
  const [order, setOrder] = useState<SavedOrder | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    const found = getOrders().find((o) => o.orderNumber === orderNumber);
    if (found) setOrder(found);
  }, [orderNumber]);

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-extrabold">Your Order Has Been Placed!</h1>
        <p className="mt-2 text-muted-foreground">Thank you. We received your order.</p>

        {order ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 text-left">
            <InfoRow label="Order Number" value={`#${order.orderNumber}`} big />
            <InfoRow label="Order Total" value={formatPKR(order.total)} big />
            <InfoRow label="Payment" value="Cash on Delivery" />
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">Delivery Address</div>
              <div className="mt-1 font-semibold">{order.name}</div>
              <div>{order.phone}</div>
              <div>{order.address}</div>
              <div>{order.city}{order.landmark ? `, ${order.landmark}` : ""}</div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Your order has been saved.
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-secondary p-6 text-left">
          <h3 className="mb-3 text-lg font-bold">What happens next?</h3>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            <li>We will confirm your order by call or WhatsApp.</li>
            <li>Your shoes will be packed carefully.</li>
            <li>Your order will be delivered to your address.</li>
            <li>Pay cash when it arrives.</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/track-order"
            className="rounded-xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground"
          >
            Track My Order
          </Link>
          <Link
            to="/shop"
            className="rounded-xl border border-border bg-background px-5 py-3 text-base font-bold"
          >
            Continue Shopping
          </Link>
          <a
            href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(`Assalamualaikum, I need help with my order ${orderNumber ? "#" + orderNumber : ""}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 py-3 text-base font-bold text-whatsapp-foreground"
          >
            <MessageCircle className="h-5 w-5" /> WhatsApp
          </a>
        </div>
      </div>
    </Layout>
  );
}

function InfoRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className={big ? "text-xl font-extrabold" : "text-base font-semibold"}>{value}</div>
    </div>
  );
}
