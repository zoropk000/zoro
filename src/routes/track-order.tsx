import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { findOrder, type SavedOrder } from "@/lib/orders";
import { formatPKR } from "@/lib/currency";
import { Check, Circle, Package } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/track-order")({
  head: () => ({ meta: [{ title: "Track Your Order - ZORO" }] }),
  component: TrackPage,
});

const STEPS: SavedOrder["status"][] = ["Received", "Confirmed", "Packed", "Shipped", "Delivered"];

function TrackPage() {
  const [orderNum, setOrderNum] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";

  const stepLabels: Record<string, string> = {
    Received: t("statusReceived"),
    Confirmed: t("statusConfirmed"),
    Packed: t("statusPacked"),
    Shipped: t("statusShipped"),
    Delivered: t("statusDelivered"),
  };

  const paymentDisplay =
    order?.paymentMethod === "cod"
      ? t("paymentCodDisplay")
      : order?.paymentMethod === "easypaisa"
        ? t("paymentEasypaisaDisplay")
        : order?.paymentMethod === "meezan"
          ? t("paymentMeezanDisplay")
          : t("paymentCodDisplay");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const found = findOrder(orderNum, phone);
    if (found) {
      setOrder(found);
      setNotFound(false);
    } else {
      setOrder(null);
      setNotFound(true);
    }
  };

  const currentIdx = order ? STEPS.indexOf(order.status) : -1;

  return (
    <Layout>
      <div className={`mx-auto max-w-2xl px-4 py-10 ${isUrdu ? "text-right" : ""}`}>
        <h1 className={`mb-2 font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
          {t("trackYourOrder")}
        </h1>
        <p className="mb-6 text-muted-foreground">{t("trackSubtitle")}</p>

        {/* Track form */}
        <form
          onSubmit={handleTrack}
          className={`space-y-4 rounded-2xl border border-border bg-card p-5 ${isUrdu ? "text-right" : ""}`}
        >
          <div>
            <label className={`mb-1 block text-sm font-semibold ${isUrdu ? "text-right" : ""}`}>
              {t("orderNumberLabel")}
            </label>
            {/* Order number - always LTR */}
            <input
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value)}
              placeholder={t("orderNumberPlaceholder")}
              dir="ltr"
              className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base"
              style={{ minHeight: "52px", textAlign: "left" }}
            />
          </div>
          <div>
            <label className={`mb-1 block text-sm font-semibold ${isUrdu ? "text-right" : ""}`}>
              {t("mobileNumberLabel")}
            </label>
            {/* Phone number - always LTR */}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("mobileLabelPlaceholder")}
              dir="ltr"
              className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base"
              style={{ minHeight: "52px", textAlign: "left" }}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground"
            style={{ minHeight: "52px" }}
          >
            {t("trackOrderBtn")}
          </button>
        </form>

        {/* Not found */}
        {notFound && (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {t("orderNotFound")}
          </div>
        )}

        {/* Order result */}
        {order && (
          <div className={`mt-6 space-y-4 rounded-2xl border border-border bg-card p-5 ${isUrdu ? "text-right" : ""}`}>
            <div className={`flex items-center gap-2 text-lg font-bold ${isUrdu ? "flex-row-reverse justify-end" : ""}`}>
              <Package className="h-5 w-5 flex-shrink-0 text-primary" />
              {/* Order number always LTR */}
              <span dir="ltr" className="ltr-content">#{order.orderNumber}</span>
            </div>

            <div className="text-sm text-muted-foreground">
              {t("total")}:{" "}
              <span dir="ltr" className="ltr-content font-semibold text-foreground">
                {formatPKR(order.total)}
              </span>
              <br />
              {t("paymentLabel")}{" "}
              <span className="font-semibold text-foreground">{paymentDisplay}</span>
            </div>

            {/* Status steps */}
            <ol className="space-y-3">
              {STEPS.map((step, i) => {
                const done = i <= currentIdx;
                return (
                  <li
                    key={step}
                    className={`flex items-center gap-3 ${isUrdu ? "flex-row-reverse" : ""}`}
                  >
                    {done ? (
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-border text-muted-foreground">
                        <Circle className="h-3 w-3" />
                      </span>
                    )}
                    <span className={done ? "font-semibold" : "text-muted-foreground"}>
                      {stepLabels[step]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </Layout>
  );
}
