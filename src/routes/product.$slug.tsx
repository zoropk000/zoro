import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import { ProductCard } from "@/components/ProductCard";
import { getDiscount, getProduct, getProducts } from "@/services/productService";
import { useStorefront, defaultCategories } from "@/services/storefrontService";
import { formatPKR } from "@/lib/currency";
import { useCart } from "@/lib/cart-context";
import { useCustomer } from "@/lib/customer-context";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";
import { toast } from "sonner";
export const Route = createFileRoute("/product/$slug")({
  head: () => ({ meta: [{ title: "Product Details - ZORO" }] }),
  component: ProductPage,
});
function ProductPage() {
  const { slug } = Route.useParams();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(0);
  const [guide, setGuide] = useState(false);
  const { addItem } = useCart();
  const { wishlist, toggleWishlist } = useCustomer();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { data: config } = useStorefront();
  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["product", slug], queryFn: () => getProduct(slug) });
  const { data: related } = useQuery({
    queryKey: ["related", product?.category, product?.id],
    queryFn: () => getProducts({ category: product!.category, limit: 5 }),
    enabled: !!product,
  });
  useEffect(() => {
    setSize("");
    setColor("");
    setImage(0);
    setQuantity(1);
  }, [slug]);
  useEffect(() => {
    if (product) document.title = `${product.name} — ZORO`;
  }, [product?.name]);
  if (isLoading)
    return (
      <Layout>
        <div className="store-container product-page product-detail-grid">
          <div className="product-skeleton">
            <div />
          </div>
          <div className="product-skeleton">
            <span />
            <span />
            <div className="mt-8" />
          </div>
        </div>
      </Layout>
    );
  if (isError || !product)
    return (
      <Layout>
        <div className="store-container home-section collection-empty">
          <h1 className="text-2xl">This product is unavailable.</h1>
          <p>Try again, or explore something new.</p>
          <button className="text-link" onClick={() => refetch()}>
            Try again
          </button>
          <Link to="/shop" className="text-link">
            Explore the collection <ArrowUpRight size={15} />
          </Link>
        </div>
      </Layout>
    );
  const category = (config?.categories || defaultCategories).find(
    (c) => c.slug === product.category,
  );
  const type = category?.type || product.category;
  const optionsLabel =
    type === "perfumes" ? "Bottle size" : ["shoes", "clothing"].includes(type) ? "Size" : "Option";
  const selectedSize = size || (product.sizes.length === 1 ? product.sizes[0].size : "");
  const selectedColor = color || (product.colors.length === 1 ? product.colors[0] : "");
  const stock = product.sizes.find((s) => s.size === selectedSize)?.stock || 0;
  const discount = getDiscount(product);
  const purchase = (buyNow = false) => {
    if (!selectedSize) return toast.error(`Please choose a ${optionsLabel.toLowerCase()}.`);
    if (product.colors.length > 1 && !selectedColor) return toast.error("Please choose a colour.");
    if (stock < quantity) return toast.error("That quantity is not available for this option.");
    const added = addItem(product.id, selectedSize, quantity, selectedColor);
    if (buyNow && added) navigate({ to: "/checkout" });
  };
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand || "ZORO" },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability:
        product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <div className="store-container product-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={10} />
          <a href={`/shop?category=${product.category}`}>{category?.name || "Shop"}</a>
          <ChevronRight size={10} />
          <span>{product.name}</span>
        </nav>
        <div className="product-detail-grid">
          <div>
            <div className="product-main-image">
              <img
                src={product.images[image] || "/logo.png"}
                alt={`${product.name} — image ${image + 1}`}
                fetchPriority="high"
                width="800"
                height="800"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    aria-label="Previous product image"
                    onClick={() =>
                      setImage((image - 1 + product.images.length) % product.images.length)
                    }
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    aria-label="Next product image"
                    onClick={() => setImage((image + 1) % product.images.length)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            <div className="product-thumbnails">
              {product.images.map((url, i) => (
                <button
                  key={url}
                  aria-label={`Show product image ${i + 1}`}
                  aria-pressed={image === i}
                  className={image === i ? "selected" : ""}
                  onClick={() => setImage(i)}
                >
                  <img src={url} alt="" width="65" height="75" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
          <div className="product-info">
            <span className="small-eyebrow">
              {product.brand || "ZORO"} · {category?.name || product.category}
            </span>
            <h1>{lang === "ur" && product.nameUrdu ? product.nameUrdu : product.name}</h1>
            <div className="product-rating">
              {product.reviewCount > 0 ? (
                <>
                  <Star size={13} fill="currentColor" />
                  {product.rating.toFixed(1)} · {product.reviewCount} reviews
                </>
              ) : (
                "No customer reviews yet"
              )}
            </div>
            <div className="product-prices">
              <strong>{formatPKR(product.price)}</strong>
              {discount > 0 && (
                <>
                  <del>{formatPKR(product.oldPrice!)}</del>
                  <span className="text-xs text-[#a04e3a]">Save {discount}%</span>
                </>
              )}
            </div>
            <p className="product-short-description">
              {lang === "ur" && product.shortDescriptionUrdu
                ? product.shortDescriptionUrdu
                : product.shortDescription}
            </p>
            <div className="stock-label">
              {product.stockStatus === "Out of Stock"
                ? "Currently out of stock"
                : product.stockStatus === "Low Stock"
                  ? "Limited stock available"
                  : "In stock and ready for you"}
            </div>
            <div className="product-options">
              <div>
                <span>
                  {optionsLabel}
                  {selectedSize ? `: ${selectedSize}` : " — select an option"}
                </span>
                {type === "shoes" && <button onClick={() => setGuide(true)}>Size guide</button>}
              </div>
              <div className="option-buttons">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    disabled={s.stock <= 0}
                    aria-pressed={selectedSize === s.size}
                    className={selectedSize === s.size ? "selected" : ""}
                    onClick={() => {
                      setSize(s.size);
                      setQuantity(1);
                    }}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
            {product.colors.length > 0 && (
              <div className="product-options">
                <div>
                  <span>Colour{selectedColor ? `: ${selectedColor}` : " — select an option"}</span>
                </div>
                <div className="option-buttons">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      aria-pressed={selectedColor === c}
                      className={selectedColor === c ? "selected" : ""}
                      onClick={() => setColor(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.fragranceType && (
              <p className="product-extra">Fragrance type: {product.fragranceType}</p>
            )}
            <div className="flex items-center gap-4 text-xs">
              <span>Quantity</span>
              <div className="flex items-center border border-border">
                <button
                  className="p-2"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(quantity - 1)}
                >
                  <Minus size={14} />
                </button>
                <span className="px-3">{quantity}</span>
                <button
                  className="p-2"
                  aria-label="Increase quantity"
                  disabled={!selectedSize || quantity >= Math.min(stock, 100)}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="product-purchase">
              <button
                className="store-button"
                disabled={product.totalStock <= 0}
                onClick={() => purchase()}
              >
                <ShoppingBag size={17} />
                Add to bag <ArrowUpRight size={17} />
              </button>
              <button
                aria-label="Save product to wishlist"
                aria-pressed={wishlist.includes(product.id)}
                className={`wishlist-button ${wishlist.includes(product.id) ? "is-saved" : ""}`}
                onClick={() => toggleWishlist(product.id)}
              >
                <Heart size={20} />
              </button>
            </div>
            <button
              className="product-buy-now"
              disabled={product.totalStock <= 0}
              onClick={() => purchase(true)}
            >
              Buy now
            </button>
            <div className="product-delivery">
              <Truck size={19} />
              <div>
                Delivered across Pakistan. Cash on delivery available.
                <br />
                Shipping {formatPKR(config?.shipping?.fee ?? siteConfig.deliveryFee)} · Free on
                orders over{" "}
                {formatPKR(config?.shipping?.freeThreshold ?? siteConfig.freeDeliveryThreshold)}.
                <br />
                <Link to="/delivery" className="underline">
                  View shipping details
                </Link>
              </div>
            </div>
            <details className="product-accordion" open>
              <summary>Details that matter</summary>
              {(lang === "ur" && product.descriptionUrdu?.length
                ? product.descriptionUrdu
                : product.description
              ).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              {!product.description.length && (
                <p>
                  {product.shortDescription ||
                    "Contact our team for more information about this product."}
                </p>
              )}
            </details>
            <details className="product-accordion">
              <summary>Delivery & returns</summary>
              <p>
                We deliver across Pakistan. Shipping costs are shown before you place your order.
                For delivery timings and exchanges, see our{" "}
                <Link to="/delivery" className="underline">
                  delivery information
                </Link>{" "}
                and{" "}
                <Link to="/returns" className="underline">
                  returns policy
                </Link>
                .
              </p>
            </details>
            <details className="product-accordion">
              <summary>Customer ratings</summary>
              <p>
                {product.reviewCount
                  ? `${product.rating.toFixed(1)} out of 5 from ${product.reviewCount} customer reviews.`
                  : "There are no customer reviews for this product yet."}
              </p>
            </details>
            <div className="product-extra">
              {product.sku && <span>SKU: {product.sku}</span>}
              <a
                href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(`Hi ZORO, I'd like to know more about ${product.name}.`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ask us on WhatsApp ↗
              </a>
            </div>
          </div>
        </div>
        {(related?.products || []).some((p) => p.id !== product.id) && (
          <section className="home-section">
            <div className="section-heading">
              <div>
                <span className="small-eyebrow">MORE YOUR KIND OF THINGS</span>
                <h2>You might also love.</h2>
              </div>
            </div>
            <div className="store-product-grid">
              {related!.products
                .filter((p) => p.id !== product.id)
                .slice(0, 4)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </section>
        )}
      </div>
      {guide && <SizeGuideModal onClose={() => setGuide(false)} />}
    </Layout>
  );
}
