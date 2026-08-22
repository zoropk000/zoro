import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import { ProductCard } from "@/components/ProductCard";
import { getDiscount, getProduct, getProducts } from "@/services/productService";
import { formatPKR } from "@/lib/currency";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Star,
  Truck,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  head: () => ({ meta: [{ title: "Product - ZORO" }] }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const [size, setSize] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [openDetails, setOpenDetails] = useState<string | null>("details");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug),
  });
  const { data: relatedData } = useQuery({
    queryKey: ["related-products", product?.gender, product?.id],
    queryFn: () => getProducts({ gender: product!.gender, limit: 5 }),
    enabled: !!product,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <div>
            <Skeleton className="h-9 w-4/5" />
            <Skeleton className="mt-4 h-6 w-32" />
            <Skeleton className="mt-8 h-12 w-48" />
            <Skeleton className="mt-6 h-20 w-full" />
            <Skeleton className="mt-6 h-14 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !product) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold">{t("productUnavailable")}</h1>
          <p className="mt-2 text-muted-foreground">{t("couldNotLoadShoes")}</p>
          <button
            onClick={() => refetch()}
            className="mt-6 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
          >
            {t("tryAgain")}
          </button>
        </div>
      </Layout>
    );
  }

  const discount = getDiscount(product);
  const related = (relatedData?.products || []).filter((p) => p.id !== product.id).slice(0, 4);

  const handleAdd = (buyNow = false) => {
    if (!size) {
      toast.error(t("selectSizeFirst"));
      return;
    }
    const selected = product.sizes.find((row) => row.size === size);
    if (!selected || selected.stock <= 0) {
      toast.error(t("outOfStock"));
      return;
    }
    addItem(product.id, size, 1);
    if (buyNow) navigate({ to: "/checkout" });
  };

  const displayDescription =
    lang === "ur" && product.shortDescriptionUrdu
      ? product.shortDescriptionUrdu
      : product.shortDescription;


  const accordions = [
    {
      key: "details",
      label: t("productDetails"),
      body: (
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {(lang === "ur" && product.descriptionUrdu
            ? product.descriptionUrdu
            : product.description
          ).map((d: string, i: number) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      ),
    },
    {
      key: "size",
      label: t("sizeInformation"),
      body: (
        <p className="text-sm text-muted-foreground">
          {t("sizeInfoText").replace("%s", product.sizes.map((row) => row.size).join(", "))}
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
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            {t("breadcrumbHome")}
          </Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-primary">
            {t("breadcrumbShop")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-secondary">
              <div className="aspect-square">
                <img
                  src={product.images[imgIdx]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setImgIdx((i) => (i - 1 + product.images.length) % product.images.length)
                    }
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
              <div className="mt-3 flex gap-2">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${imgIdx === i ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-semibold">{product.rating}</span>
              <span className="text-muted-foreground">
                ({product.reviewCount} {t("reviews")})
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold text-foreground">
                {formatPKR(product.price)}
              </span>
              {product.oldPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPKR(product.oldPrice)}
                  </span>
                  <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-sale-foreground">
                    {t("youSave")} {formatPKR(product.oldPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 text-muted-foreground">{displayDescription}</p>

            {/* Size */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-base font-bold text-foreground">{t("selectYourSize")}</label>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-sm font-semibold text-primary underline"
                >
                  {t("viewSizeGuide")}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((row) => (
                  <button
                    key={row.size}
                    disabled={row.stock <= 0}
                    onClick={() => setSize(row.size)}
                    className={`h-12 min-w-12 rounded-lg border-2 px-3 text-base font-semibold transition ${
                      row.stock <= 0
                        ? "cursor-not-allowed border-border bg-secondary text-muted-foreground line-through"
                        : size === row.size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-secondary"
                    }`}
                  >
                    {row.size}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("sizeHelpText")}</p>
            </div>

            {/* Buttons — desktop */}
            <div className="mt-6 hidden gap-3 md:flex">
              <button
                onClick={() => handleAdd(true)}
                className="flex-1 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground hover:bg-primary/90"
              >
                {t("buyNow")}
              </button>
              <button
                onClick={() => handleAdd(false)}
                className="flex-1 rounded-xl border-2 border-primary bg-background py-4 text-base font-bold text-primary hover:bg-secondary"
              >
                {t("addToCart")}
              </button>
            </div>

            <div className="mt-6 grid gap-2 rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
              <Line icon={<Wallet className="h-4 w-4 text-success" />} text={t("codBenefit")} />
              <Line icon={<Truck className="h-4 w-4 text-primary" />} text={t("deliveryBenefit")} />
              <Line
                icon={<RefreshCw className="h-4 w-4 text-primary" />}
                text={t("exchangeBenefit")}
              />
            </div>

            {/* Accordions */}
            <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
              {accordions.map((row) => (
                <div key={row.key}>
                  <button
                    onClick={() => setOpenDetails(openDetails === row.key ? null : row.key)}
                    className="flex w-full items-center justify-between p-4 text-left font-semibold"
                  >
                    {row.label}
                    <span>{openDetails === row.key ? "−" : "+"}</span>
                  </button>
                  {openDetails === row.key && <div className="px-4 pb-4">{row.body}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-2xl font-bold">{t("youMayAlsoLike")}</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-background p-3 md:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => handleAdd(false)}
            className="flex-1 rounded-xl border-2 border-primary bg-background py-3 text-sm font-bold text-primary"
          >
            {t("addToCart")}
          </button>
          <button
            onClick={() => handleAdd(true)}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
          >
            {t("buyNow")}
          </button>
        </div>
      </div>

      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}
    </Layout>
  );
}

function Line({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-foreground">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
