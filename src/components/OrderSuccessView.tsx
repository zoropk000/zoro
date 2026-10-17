import { Link } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "@tanstack/react-query";
import { trackOrder } from "@/services/orderService";
import { PaymentProofPanel } from "./PaymentProofPanel";

type RecentOrder = {
  orderNumber?: string;
  phone?: string;
};

export function OrderSuccessView({ orderNumber }: { orderNumber?: string }) {
  const { t, lang } = useLanguage();

  let recentOrders: RecentOrder[] = [];
  try {
    const stored =
      typeof window !== "undefined" ? JSON.parse(localStorage.getItem("recentOrders") || "[]") : [];
    if (Array.isArray(stored)) recentOrders = stored;
  } catch {
    /* Tracking is still available when storage is unavailable. */
  }
  const matched = recentOrders.find((o: RecentOrder) => o.orderNumber === orderNumber);
  const phone = matched?.phone || "";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["success-order", orderNumber, phone],
    queryFn: () => trackOrder(orderNumber || "", phone),
    enabled: !!orderNumber && !!phone,
  });

  const order = data?.order;

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-extrabold">{t("orderPlaced")}</h1>
        <p className="mt-2 text-muted-foreground">{t("orderPlacedThank")}</p>

        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-primary/10 border border-primary/20 p-5 text-sm font-semibold text-primary shadow-sm">
          {t("checkEmailNotification")}
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 text-left">
          <InfoRow label={t("orderNumber")} value={orderNumber ? `#${orderNumber}` : "-"} big />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loadingOrder")}</p>
          ) : order ? (
            <div className="space-y-4 border-t border-border pt-4">
              <div>
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("emailAddressLabel")}
                </span>
                <p className="text-sm font-bold text-foreground mt-1">
                  {t("emailSentTo")}: <span className="text-primary">{order.customer.email}</span>
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("recentStatusLabel")}
                </span>
                <div className="text-base font-bold text-foreground flex items-center gap-2 mt-1">
                  {order.orderStatus === "pending" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-600">
                      ⏳ {t("statusWaitingConfirm")}
                    </span>
                  ) : order.orderStatus === "confirmed" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-600">
                      ✅ {t("statusConfirmed")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                      {order.orderStatus}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("deliveryEstimateLabel")}
                </span>
                {order.orderStatus === "pending" ? (
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {t("confirmTimeConfirmingShort")}
                  </p>
                ) : order.deliveryEstimate && order.deliveryEstimate.minDays ? (
                  <div className="mt-1">
                    <p className="text-base font-bold text-foreground">
                      {order.deliveryEstimate.minDays}–{order.deliveryEstimate.maxDays}{" "}
                      {t("workingDaysLabel")}
                    </p>
                    {order.deliveryEstimate.estimatedStartDate && (
                      <p className="text-sm text-muted-foreground">
                        {t("expectedBetweenLabel")}:{" "}
                        <span className="font-semibold text-foreground">
                          {new Date(order.deliveryEstimate.estimatedStartDate).toLocaleDateString(
                            lang === "ur" ? "ur-PK" : "en-GB",
                            { day: "numeric", month: "long" },
                          )}{" "}
                          –{" "}
                          {new Date(order.deliveryEstimate.estimatedEndDate).toLocaleDateString(
                            lang === "ur" ? "ur-PK" : "en-GB",
                            { day: "numeric", month: "long" },
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {t("confirmTimeConfirmingShort")}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("orderSaved")}</p>
          )}
        </div>

        {order && (
          <div className="mt-5">
            <PaymentProofPanel
              order={order}
              onUploaded={async () => {
                await refetch();
              }}
            />
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
            search={{ orderNumber, phone: phone || undefined }}
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
