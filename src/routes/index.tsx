import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { reviews } from "@/data/reviews";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";
import { MessageCircle, ShieldCheck, Truck, Wallet, RefreshCw, Headphones, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  const bestSellers = products.filter((p) => p.bestSeller).slice(0, 8);

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
      {/* Hero */}
      <section className="bg-secondary/50">
        <div
          className={`mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 sm:py-14 md:grid-cols-2 md:gap-10 ${isUrdu ? "md:flex md:flex-row-reverse" : ""
            }`}
        >
          <div className="flex-1">
            <h1
              className={`hero-title font-extrabold leading-tight text-foreground ${isUrdu
                  ? "text-3xl sm:text-4xl md:text-5xl"
                  : "text-4xl sm:text-5xl md:text-6xl"
                }`}
            >
              {t("heroTitle")}
            </h1>
            <p
              className={`hero-subtitle mt-4 text-muted-foreground ${isUrdu ? "text-base sm:text-lg" : "text-lg"
                }`}
            >
              {t("heroSubtitle")}
              <br />
              <span className="font-semibold text-foreground">{t("heroPay")}</span>
            </p>
            <div
              className={`mt-6 flex flex-wrap gap-3 ${isUrdu ? "justify-end" : ""}`}
            >
              <Link
                to="/shop"
                className="rounded-xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90"
              >
                {t("shopShoes")}
              </Link>
              <Link
                to="/sale"
                className="rounded-xl border border-primary bg-background px-5 py-3 text-base font-bold text-primary hover:bg-secondary"
              >
                {t("viewSale")}
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <TrustPoint icon={<Truck className="h-4 w-4 flex-shrink-0" />} label={t("deliveryAcrossPak")} />
              <TrustPoint icon={<Wallet className="h-4 w-4 flex-shrink-0" />} label={t("cashOnDelivery")} />
              <TrustPoint icon={<RefreshCw className="h-4 w-4 flex-shrink-0" />} label={t("easySizeExchange")} />
            </div>
          </div>
          {/* Hero image */}
          <div className="image-overflow order-first aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-background shadow-xl sm:max-w-md md:order-none md:flex-1">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80"
              alt="Comfortable shoes"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Shop by Category - Men & Women only */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionTitle title={t("shopByCategory")} subtitle={t("shopByCategorySub")} isUrdu={isUrdu} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <Link key={c.to} to={c.to} className="group relative overflow-hidden rounded-3xl bg-secondary">
              <div className="image-overflow aspect-[4/3] overflow-hidden">
                <img
                  src={c.img}
                  alt={t(c.titleKey)}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
                <div
                  className={`category-card-title font-extrabold text-white ${isUrdu ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
                    }`}
                >
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
      <section className="bg-secondary/40 py-10">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title={t("bestSellers")} subtitle={t("bestSellersSub")} isUrdu={isUrdu} />
          <div className="product-grid-2col grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* How to Order */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle title={t("howToOrder")} subtitle={t("howToOrderSub")} isUrdu={isUrdu} />
        <div className="grid gap-4 md:grid-cols-3">
          <Step n={1} title={t("step1Title")} text={t("step1Text")} />
          <Step n={2} title={t("step2Title")} text={t("step2Text")} />
          <Step n={3} title={t("step3Title")} text={t("step3Text")} />
        </div>
      </section>

      {/* Why Trust Us */}
      <section className="bg-secondary/40 py-10">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title={t("whyTrustUs")} isUrdu={isUrdu} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TrustCard icon={<ShieldCheck className="h-6 w-6" />} title={t("trustOriginalQuality")} text={t("trustOriginalQualityText")} />
            <TrustCard icon={<Wallet className="h-6 w-6" />} title={t("trustCOD")} text={t("trustCODText")} />
            <TrustCard icon={<RefreshCw className="h-6 w-6" />} title={t("trustExchange")} text={t("trustExchangeText")} />
            <TrustCard icon={<Headphones className="h-6 w-6" />} title={t("trustSupport")} text={t("trustSupportText")} />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionTitle title={t("customerReviews")} subtitle={t("customerReviewsSub")} isUrdu={isUrdu} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 flex">
                {Array.from({ length: r.rating }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-foreground">{r.text}</p>
              <div className="mt-3 text-xs font-semibold text-muted-foreground">- {r.name}, {r.city}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp Help */}
      <section className="bg-primary py-10 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2
            className={`font-extrabold ${isUrdu ? "text-xl sm:text-2xl leading-[1.8]" : "text-2xl sm:text-3xl"
              }`}
          >
            {t("needHelpSize")}
          </h2>
          <p className="mt-3 text-primary-foreground/80">{t("needHelpSizeText")}</p>
          <a
            href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(t("waHelpMsg"))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-5 py-3 text-base font-bold text-whatsapp-foreground hover:opacity-90"
          >
            <MessageCircle className="h-5 w-5 flex-shrink-0" />
            {t("chatOnWhatsApp")}
          </a>
        </div>
      </section>
    </Layout>
  );
}

function SectionTitle({ title, subtitle, isUrdu }: { title: string; subtitle?: string; isUrdu?: boolean }) {
  return (
    <div className={`mb-6 ${isUrdu ? "text-right" : "text-center"} sm:mb-8`}>
      <h2
        className={`section-title font-extrabold text-foreground ${isUrdu ? "text-xl sm:text-2xl md:text-3xl" : "text-2xl sm:text-3xl"
          }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      )}
    </div>
  );
}

function TrustPoint({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="trust-point flex items-start gap-2 rounded-xl bg-background/80 px-3 py-2.5 text-sm font-medium text-foreground">
      <span className="mt-0.5 flex-shrink-0 text-primary">{icon}</span>
      <span>{label}</span>
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
    <div className="step-card rounded-2xl border border-border bg-card p-5 text-center">
      <div className="step-number mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-extrabold text-accent-foreground">
        {n}
      </div>
      <div className="text-base font-bold text-foreground">{title}</div>
      <div className="mt-1.5 text-sm text-muted-foreground">{text}</div>
    </div>
  );
}
