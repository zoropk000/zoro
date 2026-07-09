import { Link } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";

export function OrderSuccessView({ orderNumber }: { orderNumber?: string }) {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-extrabold">{t("orderPlaced")}</h1>
        <p className="mt-2 text-muted-foreground">{t("orderPlacedThank")}</p>

        {orderNumber ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 text-left">
            <InfoRow label={t("orderNumber")} value={`#${orderNumber}`} big />
            <p className="text-sm text-muted-foreground">{t("orderSaved")}</p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {t("orderSaved")}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-secondary p-6 text-left">
          <h3 className="mb-3 text-lg font-bold">{t("whatHappensNext")}</h3>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            <li>{t("nextStep1")}</li>
            <li>{t("nextStep2")}</li>
            <li>{t("nextStep3")}</li>
            <li>{t("nextStep4COD")}</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/track-order"
            className="rounded-xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground"
          >
            {t("trackMyOrder")}
          </Link>
          <Link
            to="/shop"
            className="rounded-xl border border-border bg-background px-5 py-3 text-base font-bold"
          >
            {t("continueShopping")}
          </Link>
          <a
            href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(`${t("waOrderMsg")} ${orderNumber ? "#" + orderNumber : ""}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 py-3 text-base font-bold text-whatsapp-foreground"
          >
            <MessageCircle className="h-5 w-5" /> {t("whatsappHelp")}
          </a>
        </div>
      </div>
    </Layout>
  );
}

function InfoRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className={big ? "text-xl font-extrabold" : "text-base font-semibold"}>{value}</div>
    </div>
  );
}
