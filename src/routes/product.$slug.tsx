import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import { ProductCard } from "@/components/ProductCard";
import { getProductBySlug, getDiscount, products } from "@/data/products";
import { formatPKR } from "@/lib/currency";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/config/siteConfig";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  RefreshCw,
  Star,
  Truck,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.product.name} — StepStyle Pakistan` : "Product" },
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

  const discount = getDiscount(product);
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  const handleAdd = (buyNow = false) => {
    if (!size) {
      toast.error("Please select your shoe size first.");
      return;
    }
    addItem(product.id, size, 1);
    if (buyNow) navigate({ to: "/checkout" });
  };

  const waMsg = encodeURIComponent(`Assalamualaikum, I need help with this shoe: ${product.name}`);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-6 pb-32 md:pb-8">
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-primary">Shop</Link>
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
              <div className="mt-3 flex gap-2">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${
                      imgIdx === i ? "border-primary" : "border-transparent"
                    }`}
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
              <span className="text-muted-foreground">({product.reviewCount} Reviews)</span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold text-foreground">{formatPKR(product.price)}</span>
              {product.oldPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatPKR(product.oldPrice)}</span>
                  <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-sale-foreground">
                    You Save {formatPKR(product.oldPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 text-muted-foreground">{product.shortDescription}</p>

            {/* Size */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-base font-bold text-foreground">Select Your Size</label>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-sm font-semibold text-primary underline"
                >
                  View Simple Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s: number) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-12 min-w-12 rounded-lg border-2 px-3 text-base font-semibold transition ${
                      size === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Not sure about your size? Use the size guide above.
              </p>
            </div>

            {/* Buttons - desktop */}
            <div className="mt-6 hidden gap-3 md:flex">
              <button
                onClick={() => handleAdd(true)}
                className="flex-1 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground hover:bg-primary/90"
              >
                Buy Now
              </button>
              <button
                onClick={() => handleAdd(false)}
                className="flex-1 rounded-xl border-2 border-primary bg-background py-4 text-base font-bold text-primary hover:bg-secondary"
              >
                Add to Cart
              </button>
            </div>

            <a
              href={`https://wa.me/${siteConfig.whatsapp}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 hidden items-center justify-center gap-2 rounded-xl bg-whatsapp py-3 text-sm font-bold text-whatsapp-foreground md:flex"
            >
              <MessageCircle className="h-5 w-5" /> Order on WhatsApp
            </a>

            <div className="mt-6 grid gap-2 rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
              <Line icon={<Wallet className="h-4 w-4 text-success" />} text="Cash on Delivery — Pay when your order arrives" />
              <Line icon={<Truck className="h-4 w-4 text-primary" />} text="Delivery Across Pakistan" />
              <Line icon={<RefreshCw className="h-4 w-4 text-primary" />} text="Easy Size Exchange" />
            </div>

            <div className="mt-3 rounded-xl bg-success/10 p-3 text-center text-sm font-semibold text-success">
              💵 No Online Payment Required
              <div className="mt-1 text-xs font-normal">آن لائن پیمنٹ کی ضرورت نہیں — جوتے ملنے پر پیسے دیں</div>
            </div>

            {/* Accordions */}
            <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
              {[
                { key: "details", label: "Product Details", body: (
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {product.description.map((d: string, i: number) => (<li key={i}>{d}</li>))}
                  </ul>
                )},
                { key: "size", label: "Size Information", body: (
                  <p className="text-sm text-muted-foreground">Available sizes: {product.sizes.join(", ")}. Use the size guide to find your fit.</p>
                )},
                { key: "delivery", label: "Delivery Information", body: (
                  <p className="text-sm text-muted-foreground">Major cities: 2–4 working days. Other cities: 3–7 working days. Delivery fee Rs. {siteConfig.deliveryFee}. Free delivery over Rs. {siteConfig.freeDeliveryThreshold}.</p>
                )},
                { key: "exchange", label: "Exchange Policy", body: (
                  <p className="text-sm text-muted-foreground">Wrong size? Contact us on WhatsApp with your order number. We will guide you through the exchange process.</p>
                )},
              ].map((row) => (
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
            <h2 className="mb-5 text-2xl font-bold">You may also like</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => (<ProductCard key={p.id} product={p} />))}
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
            Add to Cart
          </button>
          <button
            onClick={() => handleAdd(true)}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
          >
            Buy Now
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
