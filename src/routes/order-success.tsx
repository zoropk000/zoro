import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { formatPKR } from "@/lib/currency";
import { getOrders, type SavedOrder } from "@/lib/orders";
import { siteConfig } from "@/config/siteConfig";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const searchSchema = z.object({ order: z.string().optional() });

export const Route = createFileRoute("/order-success")({
  head: () => ({ meta: [{ title: "Order Placed - ZORO" }] }),
  validateSearch: searchSchema,
  component: SuccessPage,
});

function SuccessPage() {
  const { order: orderNumber } = Route.useSearch();
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";

  useEffect(() => {
    if (!orderNumber) return;
    const found = getOrders().find((o) => o.orderNumber === orderNumber);
    if (found) setOrder(found);
  }, [orderNumber]);

  const paymentLabel =
    order?.paymentMethod === "cod"
      ? t("paymentCodDisplay")
      : order?.paymentMethod === "easypaisa"
        ? t("paymentEasypaisaDisplay")
        : order?.paymentMethod === "meezan"
          ? t("paymentMeezanDisplay")
          : t("paymentCodDisplay");

  return (
    <Layout>
      <div className={`mx-auto max-w-2xl px-4 py-10 ${isUrdu ? "text-right" : "text-center"}`}>
        {/* Success icon */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-12 w-12" />
        </div>

        <h1 className={`font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
          {t("orderPlaced")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("orderPlacedThank")}</p>

        {/* Order details card */}
        {order ? (
          <div
            className={`order-number-display mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 ${
              isUrdu ? "text-right" : "text-left"
            }`}
          >
            <InfoRow label={t("orderNumber")} value={`#${order.orderNumber}`} big ltr />
            <InfoRow label={t("orderTotal")} value={formatPKR(order.total)} big ltr isUrdu={isUrdu} />
            <InfoRow label={t("payment")} value={paymentLabel} isUrdu={isUrdu} />
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                {t("deliveryAddress")}
              </div>
              <div className="mt-1 font-semibold">{order.name}</div>
              {/* Phone always LTR */}
              <div dir="ltr" className="ltr-content">{order.phone}</div>
              <div>{order.address}</div>
              <div>{order.city}{order.landmark ? `, ${order.landmark}` : ""}</div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {t("orderSaved")}
          </div>
        )}

        {/* What happens next */}
        <div
          className={`mt-6 rounded-2xl bg-secondary p-6 ${isUrdu ? "text-right" : "text-left"}`}
        >
          <h3 className={`mb-3 font-bold ${isUrdu ? "text-lg leading-[1.8]" : "text-lg"}`}>
            {t("whatHappensNext")}
          </h3>
          <ol
            className={`space-y-2 text-sm ${isUrdu ? "list-none" : "list-inside list-decimal"}`}
          >
            {[
              t("nextStep1"),
              t("nextStep2"),
              t("nextStep3"),
              (!order || order.paymentMethod === "cod" || !order.paymentMethod)
                ? t("nextStep4COD")
                : t("nextStep4Paid"),
            ].map((step, i) => (
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
        </div>

        {/* Action buttons */}
        <div
          className={`mt-6 flex flex-col gap-3 sm:flex-row ${
            isUrdu ? "sm:flex-row-reverse sm:justify-start" : "sm:justify-center"
          }`}
        >
          <Link
            to="/track-order"
            className="rounded-xl bg-primary px-5 py-4 text-base font-bold text-primary-foreground"
            style={{ minHeight: "52px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {t("trackMyOrder")}
          </Link>
          <Link
            to="/shop"
            className="rounded-xl border border-border bg-background px-5 py-4 text-base font-bold"
            style={{ minHeight: "52px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {t("continueShopping")}
          </Link>
          <a
            href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
              `${t("waOrderMsg")} ${orderNumber ? "#" + orderNumber : ""}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 py-4 text-base font-bold text-whatsapp-foreground ${
              isUrdu ? "flex-row-reverse" : ""
            }`}
            style={{ minHeight: "52px" }}
          >
            <MessageCircle className="h-5 w-5 flex-shrink-0" /> {t("whatsappHelp")}
          </a>
        </div>
      </div>
    </Layout>
  );
}

function InfoRow({
  label, value, big, ltr, isUrdu,
}: {
  label: string;
  value: string;
  big?: boolean;
  ltr?: boolean;
  isUrdu?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div
        className={big ? "text-xl font-extrabold" : "text-base font-semibold"}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </div>
    </div>
  );
}
