import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useLanguage } from "@/lib/language-context";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ - ZORO" }] }),
  component: FAQPage,
});

function FAQPage() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
    { q: t("faqQ5"), a: t("faqA5") },
    { q: t("faqQ6"), a: t("faqA6") },
    { q: t("faqQ7"), a: t("faqA7") },
    { q: t("faqQ8"), a: t("faqA8") },
    { q: t("faqQ9"), a: t("faqA9") },
    { q: t("faqQ10"), a: t("faqA10") },
  ];

  return (
    <Layout>
      <div className={`mx-auto max-w-2xl px-4 py-10 ${isUrdu ? "text-right" : ""}`}>
        <h1 className={`mb-6 font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
          {t("faqTitle")}
        </h1>
        <div className="divide-y divide-border rounded-2xl border border-border">
          {faqs.map((f, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className={`faq-question flex w-full items-center px-5 py-4 text-left text-base font-semibold text-foreground ${
                  isUrdu ? "flex-row-reverse text-right" : "justify-between"
                }`}
                style={{ minHeight: "60px" }}
              >
                <span className="flex-1">{f.q}</span>
                {open === i ? (
                  <ChevronUp className="ml-2 h-5 w-5 flex-shrink-0 text-primary" />
                ) : (
                  <ChevronDown className="ml-2 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                )}
              </button>
              {open === i && (
                <div className={`px-5 pb-5 text-sm text-muted-foreground ${isUrdu ? "text-right" : ""}`}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
