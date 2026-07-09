import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { trackOrder, type TrackedOrder } from "@/services/orderService";
import { formatPKR } from "@/lib/currency";
import { Check, Circle, Package } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { z } from "zod";

const trackSearchSchema = z.object({
  orderNumber: z.string().optional(),
  phone: z.string().optional(),
});

export const Route = createFileRoute("/track-order")({
  head: () => ({ meta: [{ title: "Track Your Order - ZORO" }] }),
  validateSearch: trackSearchSchema,
  component: TrackPage,
});

const TIMELINE_STEPS = [
  { status: "pending", labelKey: "statusReceived" as const },
  { status: "confirmed", labelKey: "statusConfirmed" as const },
  { status: "preparing", labelKey: "statusPrepared" as const },
  { status: "shipped", labelKey: "statusShipped" as const },
  { status: "out_for_delivery", labelKey: "statusOutForDelivery" as const },
  { status: "delivered", labelKey: "statusDelivered" as const },
];

function TrackPage() {
  const { orderNumber: searchOrderNum, phone: searchPhone } = Route.useSearch();
  const [orderNum, setOrderNum] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t, lang } = useLanguage();

  // Handle search params prefill & auto-track
  useEffect(() => {
    if (searchOrderNum) setOrderNum(searchOrderNum);
    if (searchPhone) setPhone(searchPhone);

    if (searchOrderNum && searchPhone) {
      const autoTrack = async () => {
        try {
          setLoading(true);
          const response = await trackOrder(searchOrderNum, searchPhone);
          setOrder(response.order);
          setNotFound(false);
        } catch (err) {
          console.error(err);
          setOrder(null);
          setNotFound(true);
        } finally {
          setLoading(false);
        }
      };
      autoTrack();
    }
  }, [searchOrderNum, searchPhone]);

  const paymentDisplay =
    order?.paymentMethod === "cod"
      ? t("paymentCodDisplay")
      : order?.paymentMethod === "easypaisa_jazzcash"
        ? t("paymentEasypaisaDisplay")
        : order?.paymentMethod === "meezan_bank"
          ? t("paymentMeezanDisplay")
          : t("paymentCodDisplay");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await trackOrder(orderNum, phone);
      setOrder(response.order);
      setNotFound(false);
    } catch {
      setOrder(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(lang === "ur" ? "ur-PK" : "en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const events = order?.trackingEvents || [];
  const latestEvent = events[events.length - 1];

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10" dir={lang === "ur" ? "rtl" : "ltr"}>
        <h1 className="mb-2 text-3xl font-extrabold text-right-RTL">{t("trackYourOrder")}</h1>
        <p className="mb-6 text-muted-foreground text-right-RTL">{t("trackSubtitle")}</p>

        <form
          onSubmit={handleTrack}
          className="space-y-4 rounded-2xl border border-border bg-card p-5"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-right-RTL">{t("orderNumberLabel")}</label>
            <input
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value)}
              placeholder={t("orderNumberPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base text-right-RTL"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-right-RTL">{t("mobileNumberLabel")}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("mobileLabelPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base text-right-RTL"
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground disabled:opacity-60 cursor-pointer"
          >
            {loading ? t("loadingOrder") : t("trackOrderBtn")}
          </button>
        </form>

        {notFound && (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive text-right-RTL">
            {t("orderNotFound")}
          </div>
        )}

        {order && (
          <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-lg font-bold text-right-RTL">
              <Package className="h-5 w-5 text-primary" />#{order.orderNumber}
            </div>
            
            <div className="text-sm text-muted-foreground text-right-RTL space-y-1">
              <div>
                {t("total")}:{" "}
                <span className="font-semibold text-foreground">{formatPKR(order.total)}</span>
              </div>
              <div>
                {t("paymentLabel")}{" "}
                <span className="font-semibold text-foreground">{paymentDisplay}</span>
              </div>
            </div>

            {order.orderStatus === "cancelled" && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive text-right-RTL">
                {t("orderCancelled")}
              </div>
            )}

            {/* Waiting for confirmation message if pending */}
            {order.orderStatus === "pending" && (
              <div className="rounded-xl bg-amber-500/10 p-4 text-sm font-semibold text-amber-600 border border-amber-500/20 text-right-RTL">
                ⏳ {t("statusWaitingConfirm")}
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  {t("confirmTimeConfirmingShort")}
                </p>
              </div>
            )}

            {/* Delivery Estimate Display */}
            {order.orderStatus !== "pending" && order.deliveryEstimate && order.deliveryEstimate.minDays && (
              <div className="rounded-xl bg-secondary/50 p-4 text-sm space-y-1 text-right-RTL border border-border">
                <div className="font-extrabold text-foreground">
                  🚚 {t("deliveryEstimateLabel")}:{" "}
                  <span className="text-primary font-black">
                    {order.deliveryEstimate.minDays}–{order.deliveryEstimate.maxDays} {t("workingDaysLabel")}
                  </span>
                </div>
                {order.deliveryEstimate.estimatedStartDate && (
                  <div className="text-xs text-muted-foreground">
                    {t("deliveryEstimateExpected")}:{" "}
                    <span className="font-semibold text-foreground">
                      {new Date(order.deliveryEstimate.estimatedStartDate).toLocaleDateString(
                        lang === "ur" ? "ur-PK" : "en-GB",
                        { day: "numeric", month: "long" }
                      )}{" "}
                      –{" "}
                      {new Date(order.deliveryEstimate.estimatedEndDate).toLocaleDateString(
                        lang === "ur" ? "ur-PK" : "en-GB",
                        { day: "numeric", month: "long" }
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Visual Tracking Timeline */}
            <div className={`relative ${lang === "ur" ? "border-r pr-6 mr-3" : "border-l pl-6 ml-3"} border-border mt-8 space-y-8`}>
              {TIMELINE_STEPS.map((step) => {
                const matchedEvent = events.find(
                  (e: any) => e.status === step.status || (step.status === "preparing" && e.status === "processing")
                );
                const isCurrent = latestEvent && (latestEvent.status === step.status || (step.status === "preparing" && latestEvent.status === "processing"));
                const isCompleted = !!matchedEvent && !isCurrent;
                const isFuture = !matchedEvent;

                return (
                  <div key={step.status} className="relative">
                    {/* Indicator Circle */}
                    <span className={`absolute top-1 ${lang === "ur" ? "-right-[33px]" : "-left-[33px]"} flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background`}>
                      {isCompleted ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-[10px] font-bold text-white shadow-sm">
                          ✓
                        </span>
                      ) : isCurrent ? (
                        <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-background"></span>
                        </span>
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-border bg-card" />
                      )}
                    </span>

                    {/* Step Details */}
                    <div>
                      <h4 className={`text-base font-bold ${isFuture ? "text-muted-foreground font-normal" : "text-foreground"} text-right-RTL`}>
                        {lang === "ur" ? (
                          step.status === "pending" ? "آرڈر موصول ہو گیا" :
                          step.status === "confirmed" ? "آرڈر کی تصدیق ہو گئی" :
                          step.status === "preparing" ? "جوتے تیار کیے جا رہے ہیں" :
                          step.status === "shipped" ? "پارسل روانہ کر دیا گیا" :
                          step.status === "out_for_delivery" ? "پارسل ڈیلیوری کے لیے روانہ ہے" :
                          step.status === "delivered" ? "پارسل پہنچا دیا گیا" : t(step.labelKey)
                        ) : t(step.labelKey)}
                      </h4>
                      {matchedEvent && (
                        <p className="text-xs text-muted-foreground text-right-RTL mt-0.5 font-medium">
                          {formatEventTime(matchedEvent.timestamp)}
                        </p>
                      )}
                      {isCurrent && matchedEvent && (
                        <p className="text-sm text-foreground text-right-RTL mt-1 font-semibold leading-relaxed">
                          {lang === "ur" ? matchedEvent.descriptionUrdu : matchedEvent.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
