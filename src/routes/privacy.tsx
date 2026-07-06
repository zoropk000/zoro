import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — StepStyle Pakistan" }] }),
  component: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-4 text-3xl font-extrabold">Privacy Policy</h1>
        <p className="mb-3 text-muted-foreground">
          We collect only the information needed to deliver your order: name, mobile number,
          city, and delivery address. This information is used to process and deliver your order.
        </p>
        <p className="mb-3 text-muted-foreground">
          We do not share your details with third parties except our delivery partners.
        </p>
        <p className="mb-3 text-muted-foreground">
          For any privacy questions, please contact us.
        </p>
      </div>
    </Layout>
  ),
});
