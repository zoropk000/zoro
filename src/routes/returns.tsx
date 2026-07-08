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
  const { t } = useLanguage();
  const waMsg = encodeURIComponent(t("waExchangeMsg"));
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-extrabold">{t("returnsTitle")}</h1>
        <p className="mb-6 text-muted-foreground">{t("returnsSub")}</p>
        <ol className="mb-6 list-inside list-decimal space-y-3 rounded-2xl border border-border bg-card p-5 text-base">
          <li>{t("returnsStep1")}</li>
          <li>{t("returnsStep2")}</li>
          <li>{t("returnsStep3")}</li>
          <li>{t("returnsStep4")}</li>
        </ol>
        <a
          href={`https://wa.me/${siteConfig.whatsapp}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-4 text-base font-bold text-whatsapp-foreground hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          {t("requestExchange")}
        </a>
      </div>
    </Layout>
  );
}
