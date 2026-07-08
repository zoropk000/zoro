import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Delivery Information - ZORO" }] }),
  component: DeliveryPage,
});

function DeliveryPage() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  return (
    <Layout>
      <div className={`mx-auto max-w-2xl px-4 py-10 ${isUrdu ? "text-right" : ""}`}>
        <h1 className={`mb-6 font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
          {t("deliveryTitle")}
        </h1>
        <div className="space-y-4">
          <InfoCard title={t("deliveryAcrossPakTitle")} isUrdu={isUrdu}>
            <p className="text-sm text-muted-foreground">{t("deliveryAcrossPakText")}</p>
          </InfoCard>
          <InfoCard title={t("deliveryTimeTitle")} isUrdu={isUrdu}>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ {t("deliveryMajorCities")}</li>
              <li>✓ {t("deliveryOtherCities")}</li>
            </ul>
          </InfoCard>
          <InfoCard title={t("deliveryPaymentTitle")} isUrdu={isUrdu}>
            <p className="text-sm text-muted-foreground">{t("deliveryPaymentText")}</p>
          </InfoCard>
          <InfoCard title={t("deliveryChargesTitle")} isUrdu={isUrdu}>
            <p className="text-sm text-muted-foreground">
              {t("deliveryChargesText1")}{" "}
              <span dir="ltr" className="ltr-content font-semibold">{siteConfig.deliveryFee}</span>{" "}
              {t("deliveryChargesText2")}{" "}
              <span dir="ltr" className="ltr-content font-semibold">{siteConfig.freeDeliveryThreshold}</span>.
            </p>
          </InfoCard>
        </div>
      </div>
    </Layout>
  );
}

function InfoCard({ title, children, isUrdu }: { title: string; children: React.ReactNode; isUrdu?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${isUrdu ? "text-right" : ""}`}>
      <h2 className={`mb-2 font-bold text-foreground ${isUrdu ? "text-base leading-[1.8]" : "text-base"}`}>
        {title}
      </h2>
      {children}
    </div>
  );
}
