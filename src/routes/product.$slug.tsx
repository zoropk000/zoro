import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import { ProductCard } from "@/components/ProductCard";
import { getProductBySlug, getDiscount, products } from "@/data/products";
import { formatPKR } from "@/lib/currency";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, MessageCircle, RefreshCw, Star, Truck, Wallet } from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.product.name} - ZORO` : "Product" },
      { name: "description", content: loaderData?.product.shortDescription ?? "" },
      { property: "og:image", content: loaderData?.product.images[0] ?? "" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [size, setSize] = useState<number | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [openDetails, setOpenDetails] = useState<string | null>("details");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";

  const discount = getDiscount(product);
  const related = products
    .filter((p) => p.id !== product.id && p.gender === product.gender)
    .slice(0, 4);

  const handleAdd = (buyNow = false) => {
    if (!size) {
      toast.error(t("selectSizeFirst"));
      return;
    }
    addItem(product.id, size, 1);
    if (buyNow) navigate({ to: "/checkout" });
  };

  const displayDescription =
    isUrdu && product.shortDescriptionUr
      ? product.shortDescriptionUr
      : product.shortDescription;

  const waMsg = encodeURIComponent(`${t("waProductMsg")} ${product.name}`);

  const accordions = [
    {
      key: "details",
      label: t("productDetails"),
      body: (
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {(isUrdu && product.descriptionUr ? product.descriptionUr : product.description).map(
            (d: string, i: number) => <li key={i}>{d}</li>
          )}
        </ul>
      ),
    },
    {
      key: "size",
      label: t("sizeInformation"),
      body: (
        <p className="text-sm text-muted-foreground">
          {t("sizeInfoText").replace("%s", product.sizes.join(", "))}
        </p>
      ),
    },
    {
      key: "delivery",
      label: t("deliveryInformation"),
      body: (
        <p className="text-sm text-muted-foreground">
          {t("deliveryInfoText")
            .replace("%fee", String(siteConfig.deliveryFee))
            .replace("%threshold", String(siteConfig.freeDeliveryThreshold))}
        </p>
      ),
    },
    {
      key: "exchange",
      label: t("exchangePolicy"),
      body: <p className="text-sm text-muted-foreground">{t("exchangePolicyText")}</p>,
    },
  ];

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-6 pb-32 md:pb-8">
        {/* Breadcrumb */}
        <nav className={`mb-4 flex items-center text-sm text-muted-foreground ${isUrdu ? "flex-row-reverse justify-end" : ""}`}>
          <Link to="/" className="hover:text-primary">{t("breadcrumbHome")}</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-primary">{t("breadcrumbShop")}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className={`grid gap-8 md:grid-cols-2 ${isUrdu ? "md:flex md:flex-row-reverse" : ""}`}>
          {/* Gallery */}
          <div className={isUrdu ? "flex-1" : ""}>
            <div className="image-overflow relative overflow-hidden rounded-2xl bg-secondary">
              <div className="aspect-square">
                <img src={product.images[imgIdx]} alt={product.name} className="h-full w-full object-cover" />
              </div>
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % product.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className={`mt-3 flex gap-2 ${isUrdu ? "flex-row-reverse" : ""}`}>
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`image-overflow h-20 w-20 overflow-hidden rounded-lg border-2 ${imgIdx === i ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={`${isUrdu ? "flex-1 text-right" : ""}`}>
            <h1
              className={`font-extrabold text-foreground ${isUrdu ? "text-xl sm:text-2xl leading-[1.7]" : "text-2xl sm:text-3xl"
                }`}
            >
              {product.name}
            </h1>

            <div className={`mt-2 flex items-center gap-2 text-sm ${isUrdu ? "flex-row-reverse justify-end" : ""}`}>
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-semibold">{product.rating}</span>
              <span className="text-muted-foreground">
                (<span dir="ltr" className="ltr-content">{product.reviewCount}</span> {t("reviews")})
              </span>
            </div>

            <div className={`mt-4 flex flex-wrap items-baseline gap-3 ${isUrdu ? "flex-row-reverse justify-end" : ""}`}>
              <span className="ltr-content text-3xl font-extrabold text-foreground">
                {formatPKR(product.price)}
              </span>
              {product.oldPrice && (
                <>
                  <span className="ltr-content text-lg text-muted-foreground line-through">
                    {formatPKR(product.oldPrice)}
                  </span>
                  <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-sale-foreground">
                    {t("youSave")} <span dir="ltr" className="ltr-content">{formatPKR(product.oldPrice - product.price)}</span>
                  </span>
                </>
              )}
            </div>

            <p className="mt-3 text-muted-foreground">{displayDescription}</p>

            {/* Size selector */}
            <div className="mt-5">
              <div className={`mb-2 flex items-center justify-between ${isUrdu ? "flex-row-reverse" : ""}`}>
                <label className="text-base font-bold text-foreground">{t("selectYourSize")}</label>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-sm font-semibold text-primary underline"
                >
                  {t("viewSizeGuide")}
                </button>
              </div>
              <div className={`flex flex-wrap gap-2 ${isUrdu ? "flex-row-reverse" : ""}`}>
                {product.sizes.map((s: number) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`size-btn flex items-center justify-center rounded-lg border-2 px-3 text-base font-semibold transition ${size === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-secondary"
                      }`}
                    style={{ minWidth: "3rem", minHeight: "3rem", fontFamily: "monospace", direction: "ltr" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className={`mt-2 text-xs text-muted-foreground ${isUrdu ? "text-right" : ""}`}>
                {t("sizeHelpText")}
              </p>
            </div>

            {/* Buttons - desktop */}
            <div className={`mt-5 hidden gap-3 md:flex ${isUrdu ? "flex-row-reverse" : ""}`}>
              <button
                onClick={() => handleAdd(true)}
                className="flex-1 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground hover:bg-primary/90"
                style={{ minHeight: "52px" }}
              >
                {t("buyNow")}
              </button>
              <button
                onClick={() => handleAdd(false)}
                className="flex-1 rounded-xl border-2 border-primary bg-background py-4 text-base font-bold text-primary hover:bg-secondary"
                style={{ minHeight: "52px" }}
              >
                {t("addToCart")}
              </button>
            </div>

            <a
              href={`https://wa.me/${siteConfig.whatsapp}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 hidden items-center justify-center gap-2 rounded-xl bg-whatsapp py-3 text-sm font-bold text-whatsapp-foreground md:flex ${isUrdu ? "flex-row-reverse" : ""}`}
              style={{ minHeight: "48px" }}
            >
              <MessageCircle className="h-5 w-5 flex-shrink-0" /> {t("orderOnWhatsApp")}
            </a>

            {/* Benefits */}
            <div className="mt-5 grid gap-2 rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
              <Line icon={<Wallet className="h-4 w-4 text-success" />} text={t("codBenefit")} isUrdu={isUrdu} />
              <Line icon={<Truck className="h-4 w-4 text-primary" />} text={t("deliveryBenefit")} isUrdu={isUrdu} />
              <Line icon={<RefreshCw className="h-4 w-4 text-primary" />} text={t("exchangeBenefit")} isUrdu={isUrdu} />
            </div>

            {/* Accordions */}
            <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
              {accordions.map((row) => (
                <div key={row.key}>
                  <button
                    onClick={() => setOpenDetails(openDetails === row.key ? null : row.key)}
                    className={`accordion-header flex w-full items-center justify-between p-4 text-left font-semibold ${isUrdu ? "flex-row-reverse text-right" : ""
                      }`}
                    style={{ minHeight: "56px" }}
                  >
                    {row.label}
                    <span className="ml-2 flex-shrink-0">{openDetails === row.key ? "−" : "+"}</span>
                  </button>
                  {openDetails === row.key && (
                    <div className={`px-4 pb-4 ${isUrdu ? "text-right" : ""}`}>{row.body}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2
              className={`mb-5 text-xl font-bold sm:text-2xl ${isUrdu ? "text-right" : ""} ${isUrdu ? "leading-[1.8]" : ""
                }`}
            >
              {t("youMayAlsoLike")}
            </h2>
            <div className="product-grid-2col grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile buy bar */}
      <div className={`sticky-buy-bar fixed inset-x-0 bottom-14 z-30 border-t border-border bg-background p-3 md:hidden`}>
        <div className={`flex gap-2 ${isUrdu ? "flex-row-reverse" : ""}`}>
          <button
            onClick={() => handleAdd(false)}
            className="flex-1 rounded-xl border-2 border-primary bg-background py-3 text-sm font-bold text-primary"
            style={{ minHeight: "48px" }}
          >
            {t("addToCart")}
          </button>
          <button
            onClick={() => handleAdd(true)}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
            style={{ minHeight: "48px" }}
          >
            {t("buyNow")}
          </button>
        </div>
      </div>

      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}
    </Layout>
  );
}

function Line({ icon, text, isUrdu }: { icon: React.ReactNode; text: string; isUrdu?: boolean }) {
  return (
    <div className={`flex items-start gap-2 text-foreground ${isUrdu ? "flex-row-reverse" : ""}`}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
