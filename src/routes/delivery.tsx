import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Delivery Information - ZORO" }] }),
  component: DeliveryPage,
});

function DeliveryPage() {
  const { t } = useLanguage();
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-extrabold">{t("deliveryTitle")}</h1>
        <div className="space-y-4">
          <InfoCard title={t("deliveryAcrossPakTitle")}>
            <p className="text-sm text-muted-foreground">{t("deliveryAcrossPakText")}</p>
          </InfoCard>
          <InfoCard title={t("deliveryTimeTitle")}>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ {t("deliveryMajorCities")}</li>
              <li>✓ {t("deliveryOtherCities")}</li>
            </ul>
          </InfoCard>
          <InfoCard title={t("deliveryPaymentTitle")}>
            <p className="text-sm text-muted-foreground">{t("deliveryPaymentText")}</p>
          </InfoCard>
          <InfoCard title={t("deliveryChargesTitle")}>
            <p className="text-sm text-muted-foreground">
              {t("deliveryChargesText1")} {siteConfig.deliveryFee} {t("deliveryChargesText2")} {siteConfig.freeDeliveryThreshold}.
            </p>
          </InfoCard>
        </div>
      </div>
    </Layout>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-2 text-base font-bold text-foreground">{title}</h2>
      {children}
    </div>
  );
}
