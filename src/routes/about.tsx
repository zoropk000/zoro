import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Us — StepStyle Pakistan" }] }),
  component: () => (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-4 text-3xl font-extrabold">About {siteConfig.brandName}</h1>
        <p className="mb-4 text-muted-foreground">
          {siteConfig.brandName} is a Pakistani shoe brand focused on comfortable, affordable
          shoes for the whole family. We deliver across Pakistan with Cash on Delivery so you
          can shop with confidence.
        </p>
        <p className="mb-4 text-muted-foreground">
          Our mission is to make online shoe shopping simple and trustworthy — even for
          first-time online shoppers. No account is needed. Just choose your shoes, enter
          your details, and pay cash when your order arrives.
        </p>
        <h2 className="mt-8 mb-2 text-xl font-bold">What we offer</h2>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li>Quality checked shoes for men, women, and everyday wear</li>
          <li>Cash on Delivery all over Pakistan</li>
          <li>Easy size exchange</li>
          <li>Support in Urdu and English on WhatsApp</li>
        </ul>
      </div>
    </Layout>
  ),
});
