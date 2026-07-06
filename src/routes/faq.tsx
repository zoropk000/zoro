import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ - StepStyle Pakistan" }] }),
  component: FAQPage,
});

const FAQS = [
  { q: "How can I place an order?", a: "Choose a shoe, select your size, enter your name, phone number, and address, then click Place Order. No account is needed." },
  { q: "Is Cash on Delivery available?", a: "Yes. You pay cash when your order arrives. No online payment is required." },
  { q: "Do I need an account?", a: "No. You can place an order without creating any account." },
  { q: "How long does delivery take?", a: "Major cities: 2-4 working days. Other cities: 3-7 working days." },
  { q: "How do I choose my shoe size?", a: "Use our Simple Size Guide. Measure your foot in cm and match it to the size chart. You can also message us on WhatsApp for help." },
  { q: "What happens if the size does not fit?", a: "Contact us with your order number. We will guide you through the size exchange process." },
  { q: "Can I exchange my shoes?", a: "Yes, for size issues. The shoes must be unused and in original condition." },
  { q: "Do you deliver all over Pakistan?", a: "Yes, we deliver across Pakistan." },
  { q: "How can I track my order?", a: "Go to the Track Order page and enter your order number and mobile number." },
  { q: "How can I contact customer support?", a: "Message us on WhatsApp or call us using the numbers on our Contact page." },
];

function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-extrabold">Frequently Asked Questions</h1>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQS.map((f, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left font-semibold"
              >
                <span>{f.q}</span>
                <span className="text-xl">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p className="px-5 pb-5 text-muted-foreground">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
