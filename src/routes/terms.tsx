import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions - StepStyle Pakistan" }] }),
  component: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-4 text-3xl font-extrabold">Terms & Conditions</h1>
        <p className="mb-3 text-muted-foreground">
          By placing an order on our website, you agree that the information you provide is
          correct. Cash on Delivery orders are subject to confirmation by phone or WhatsApp.
        </p>
        <p className="mb-3 text-muted-foreground">
          Prices and availability may change without notice. Size exchange is available only
          for unused shoes in original condition.
        </p>
      </div>
    </Layout>
  ),
});
