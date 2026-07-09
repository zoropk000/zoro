import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/services/productService";
import { reviews } from "@/data/reviews";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";
import {
  MessageCircle,
  ShieldCheck,
  Truck,
  Wallet,
  RefreshCw,
  Headphones,
  Star,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { useState, useEffect } from "react";
import { trackOrder } from "@/services/orderService";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useLanguage();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home-best-sellers"],
    queryFn: async () => {
      const featured = await getProducts({ featured: true, limit: 8 });
      if (featured.products.length > 0) return featured;
      return getProducts({ limit: 8, sort: "newest" });
    },
  });
  const bestSellers = data?.products || [];

  const [lastOrder, setLastOrder] = useState<{ orderNumber: string; phone: string } | null>(null);
  useEffect(() => {
    try {
      const recentOrders = JSON.parse(localStorage.getItem("recentOrders") || "[]");
      if (recentOrders && recentOrders.length > 0) {
        setLastOrder(recentOrders[recentOrders.length - 1]);
      }
    } catch (err) {
      console.error("Failed to load recent orders", err);
    }
  }, []);

  const recentOrderQuery = useQuery({
    queryKey: ["home-recent-order", lastOrder?.orderNumber, lastOrder?.phone],
    queryFn: () => trackOrder(lastOrder?.orderNumber || "", lastOrder?.phone || ""),
    enabled: !!lastOrder,
  });

  const orderDetails = recentOrderQuery.data?.order;

  const categories = [
    {
      titleKey: "menShoes" as const,
      to: "/men" as const,
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    },
    {
      titleKey: "womenShoes" as const,
      to: "/women" as const,
      img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
    },
  ];

  return (
    <Layout>
      {/* Recent Order Tracking Card */}
      {orderDetails && (
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition duration-300 hover:shadow-md">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                {t("recentOrdersCardTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("recentOrdersCardSubtitle")}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">{t("recentOrderNumberLabel")}:</span>{" "}
                  <span className="font-extrabold text-foreground">#{orderDetails.orderNumber}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">{t("recentStatusLabel")}:</span>{" "}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {orderDetails.orderStatus === "pending"
                      ? t("statusWaitingConfirm")
                      : orderDetails.orderStatus === "confirmed"
                        ? t("statusConfirmed")
                        : orderDetails.orderStatus === "preparing" || orderDetails.orderStatus === "processing"
                          ? t("statusPrepared")
                          : orderDetails.orderStatus === "shipped"
                            ? t("statusShipped")
                            : orderDetails.orderStatus === "out_for_delivery"
                              ? t("statusOutForDelivery")
                              : orderDetails.orderStatus === "delivered"
                                ? t("statusDelivered")
                                : orderDetails.orderStatus === "cancelled"
                                  ? t("statusCancelled")
                                  : orderDetails.orderStatus}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/track-order"
              search={{ orderNumber: orderDetails.orderNumber, phone: lastOrder?.phone }}
              className="w-full sm:w-auto text-center shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              {t("recentOrdersTrackBtn")}
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-secondary/50">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:py-16 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-foreground sm:text-5xl md:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("heroSubtitle")}
              <br />
              <span className="font-semibold text-foreground">{t("heroPay")}</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90"
              >
                {t("shopShoes")}
              </Link>
              <Link
                to="/sale"
                className="rounded-xl border border-primary bg-background px-6 py-4 text-base font-bold text-primary hover:bg-secondary"
              >
                {t("viewSale")}
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <TrustPoint icon={<Truck className="h-5 w-5" />} label={t("deliveryAcrossPak")} />
              <TrustPoint icon={<Wallet className="h-5 w-5" />} label={t("cashOnDelivery")} />
              <TrustPoint icon={<RefreshCw className="h-5 w-5" />} label={t("easySizeExchange")} />
            </div>
          </div>
          <div className="relative order-first aspect-square overflow-hidden rounded-3xl bg-background shadow-xl md:order-none">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80"
              alt="Comfortable shoes"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Shop by Category — Men & Women only */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle title={t("shopByCategory")} subtitle={t("shopByCategorySub")} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {categories.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group relative overflow-hidden rounded-3xl bg-secondary"
            >
              <div className="aspect-[4/3]">
                <img
                  src={c.img}
                  alt={t(c.titleKey)}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="text-2xl font-extrabold text-white sm:text-3xl">
                  {t(c.titleKey)}
                </div>
                <div className="mt-2 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
                  {t("shopNowArrow")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-secondary/40 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title={t("bestSellers")} subtitle={t("bestSellersSub")} />
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="mt-4 h-5 w-4/5" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-4 h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="font-semibold">{t("couldNotLoadShoes")}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              >
                {t("tryAgain")}
              </button>
            </div>
          ) : bestSellers.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              {t("noShoesFound")}
            </div>
          )}
        </div>
      </section>

      {/* How to Order */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionTitle title={t("howToOrder")} subtitle={t("howToOrderSub")} />
        <div className="grid gap-6 md:grid-cols-3">
          <Step n={1} title={t("step1Title")} text={t("step1Text")} />
          <Step n={2} title={t("step2Title")} text={t("step2Text")} />
          <Step n={3} title={t("step3Title")} text={t("step3Text")} />
        </div>
      </section>

      {/* Why Trust Us */}
      <section className="bg-secondary/40 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title={t("whyTrustUs")} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TrustCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title={t("trustOriginalQuality")}
              text={t("trustOriginalQualityText")}
            />
            <TrustCard
              icon={<Wallet className="h-6 w-6" />}
              title={t("trustCOD")}
              text={t("trustCODText")}
            />
            <TrustCard
              icon={<RefreshCw className="h-6 w-6" />}
              title={t("trustExchange")}
              text={t("trustExchangeText")}
            />
            <TrustCard
              icon={<Headphones className="h-6 w-6" />}
              title={t("trustSupport")}
              text={t("trustSupportText")}
            />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle title={t("customerReviews")} subtitle={t("customerReviewsSub")} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 flex">
                {Array.from({ length: r.rating }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-foreground">{r.text}</p>
              <div className="mt-3 text-xs font-semibold text-muted-foreground">
                — {r.name}, {r.city}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp Help */}
      <section className="bg-primary py-12 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{t("needHelpSize")}</h2>
          <p className="mt-3 text-primary-foreground/80">{t("needHelpSizeText")}</p>
          <a
            href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(t("waHelpMsg"))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-4 text-base font-bold text-whatsapp-foreground hover:opacity-90"
          >
            <MessageCircle className="h-5 w-5" />
            {t("chatOnWhatsApp")}
          </a>
        </div>
      </section>
    </Layout>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 text-center sm:mb-8">
      <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
    </div>
  );
}

function TrustPoint({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm font-medium text-foreground">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

function TrustCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-base font-bold text-foreground">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{text}</div>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-extrabold text-accent-foreground">
        {n}
      </div>
      <div className="text-lg font-bold text-foreground">{title}</div>
      <div className="mt-2 text-sm text-muted-foreground">{text}</div>
    </div>
  );
}
