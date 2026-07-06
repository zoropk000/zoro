import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";

export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Delivery Information - StepStyle Pakistan" }] }),
  component: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
        <h1 className="text-3xl font-extrabold">Delivery Information</h1>
        <div>
          <h2 className="text-xl font-bold">Delivery Across Pakistan</h2>
          <p className="text-muted-foreground">We deliver to cities and towns across Pakistan.</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Delivery Time</h2>
          <p className="text-muted-foreground">Major Cities: 2–4 working days</p>
          <p className="text-muted-foreground">Other Cities: 3–7 working days</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Payment</h2>
          <p className="text-muted-foreground">Cash on Delivery. You pay when your order arrives.</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Delivery Charges</h2>
          <p className="text-muted-foreground">
            Rs. {siteConfig.deliveryFee} on all orders. Free delivery on orders over Rs. {siteConfig.freeDeliveryThreshold}.
          </p>
        </div>
      </div>
    </Layout>
  ),
});
