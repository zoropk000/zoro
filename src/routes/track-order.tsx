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
  const { t } = useLanguage();

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
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-extrabold">{t("trackYourOrder")}</h1>
        <p className="mb-6 text-muted-foreground">{t("trackSubtitle")}</p>

        <form onSubmit={handleTrack} className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="mb-1 block text-sm font-semibold">{t("orderNumberLabel")}</label>
            <input
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value)}
              placeholder={t("orderNumberPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">{t("mobileNumberLabel")}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("mobileLabelPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base"
            />
          </div>
          <button type="submit" className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground">
            {t("trackOrderBtn")}
          </button>
        </form>

        {notFound && (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {t("orderNotFound")}
          </div>
        )}

        {order && (
          <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Package className="h-5 w-5 text-primary" />
              #{order.orderNumber}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("total")}: <span className="font-semibold text-foreground">{formatPKR(order.total)}</span>
              <br />
              {t("paymentLabel")} <span className="font-semibold text-foreground">{paymentDisplay}</span>
            </div>
            <ol className="space-y-3">
              {STEPS.map((step, i) => {
                const done = i <= currentIdx;
                return (
                  <li key={step} className="flex items-center gap-3">
                    {done ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border text-muted-foreground">
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
