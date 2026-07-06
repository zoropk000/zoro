import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns & Exchange — StepStyle Pakistan" }] }),
  component: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-extrabold">Wrong Size? Don't Worry.</h1>
        <p className="mt-2 text-muted-foreground">
          If your shoes do not fit, contact us for a size exchange.
        </p>
        <ol className="mt-6 list-inside list-decimal space-y-3 text-foreground">
          <li>Contact us on WhatsApp or by phone.</li>
          <li>Tell us your order number.</li>
          <li>Keep the shoes unused and in original condition.</li>
          <li>We will guide you through the exchange process.</li>
        </ol>
        <a
          href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent("Assalamualaikum, I want to request a size exchange.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center rounded-xl bg-whatsapp px-5 py-3 text-base font-bold text-whatsapp-foreground"
        >
          Request Size Exchange on WhatsApp
        </a>
      </div>
    </Layout>
  ),
});
