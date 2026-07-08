import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns & Exchange - ZORO" }] }),
  component: ReturnsPage,
});

function ReturnsPage() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  const waMsg = encodeURIComponent(t("waExchangeMsg"));
  return (
    <Layout>
      <div className={`mx-auto max-w-2xl px-4 py-10 ${isUrdu ? "text-right" : ""}`}>
        <h1 className={`mb-2 font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
          {t("returnsTitle")}
        </h1>
        <p className="mb-6 text-muted-foreground">{t("returnsSub")}</p>
        <ol
          className={`mb-6 space-y-3 rounded-2xl border border-border bg-card p-5 text-base ${
            isUrdu ? "list-none" : "list-inside list-decimal"
          }`}
        >
          {[t("returnsStep1"), t("returnsStep2"), t("returnsStep3"), t("returnsStep4")].map((step, i) => (
            <li key={i} className={isUrdu ? "flex items-start gap-2 flex-row-reverse" : ""}>
              {isUrdu && (
                <span dir="ltr" className="ltr-content mt-0.5 flex-shrink-0 font-bold text-primary">
                  {i + 1}.
                </span>
              )}
              {step}
            </li>
          ))}
        </ol>
        <a
          href={`https://wa.me/${siteConfig.whatsapp}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-4 text-base font-bold text-whatsapp-foreground hover:opacity-90 ${
            isUrdu ? "flex-row-reverse" : ""
          }`}
          style={{ minHeight: "52px" }}
        >
          <MessageCircle className="h-5 w-5 flex-shrink-0" />
          {t("requestExchange")}
        </a>
      </div>
    </Layout>
  );
}
