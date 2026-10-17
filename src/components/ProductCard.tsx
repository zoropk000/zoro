import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ArrowUpRight, Plus, Star } from "lucide-react";
import { getDiscount, type Product } from "@/services/productService";
import { formatPKR } from "@/lib/currency";
import { useCustomer } from "@/lib/customer-context";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";
export function ProductCard({ product }: { product: Product }) {
  const discount = getDiscount(product);
  const { wishlist, toggleWishlist } = useCustomer();
  const { addItem } = useCart();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const available = product.sizes.filter((s) => s.stock > 0);
  const quickAdd = () => {
    if (available.length === 1 && product.colors.length <= 1)
      addItem(product.id, available[0].size, 1, product.colors[0]);
    else navigate({ to: "/product/$slug", params: { slug: product.slug } });
  };
  return (
    <article className="product-card">
      <div className="product-card-image">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          aria-label={`View ${product.name}`}
        >
          <img
            src={product.images[0] || "/logo.png"}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width="400"
            height="500"
          />
          {product.images[1] && (
            <img
              className="product-second-image"
              src={product.images[1]}
              alt=""
              loading="lazy"
              decoding="async"
              width="400"
              height="500"
            />
          )}
        </Link>
        <div className="product-badges">
          {discount > 0 ? (
            <span className="discount-badge">−{discount}%</span>
          ) : product.newArrival ? (
            <span>JUST IN</span>
          ) : product.bestSeller ? (
            <span>BESTSELLER</span>
          ) : null}
        </div>
        <button
          className={`wishlist-button ${wishlist.includes(product.id) ? "is-saved" : ""}`}
          onClick={() => toggleWishlist(product.id)}
          aria-label={`${wishlist.includes(product.id) ? "Remove" : "Save"} ${product.name} ${wishlist.includes(product.id) ? "from" : "to"} wishlist`}
          aria-pressed={wishlist.includes(product.id)}
        >
          <Heart size={18} />
        </button>
        <button className="quick-add" onClick={quickAdd} disabled={product.totalStock <= 0}>
          <span>
            {product.totalStock <= 0
              ? "Out of stock"
              : available.length > 1 || product.colors.length > 1
                ? "Choose options"
                : "Add to bag"}
          </span>
          <Plus size={17} />
        </button>
      </div>
      <div className="product-card-content">
        <div className="product-meta">
          <span>{product.brand || "ZORO"}</span>
          {product.reviewCount > 0 && (
            <span>
              <Star size={11} fill="currentColor" /> {product.rating.toFixed(1)} (
              {product.reviewCount})
            </span>
          )}
        </div>
        <Link to="/product/$slug" params={{ slug: product.slug }} className="product-name">
          {lang === "ur" && product.nameUrdu ? product.nameUrdu : product.name}
        </Link>
        <div className="product-prices">
          <strong>{formatPKR(product.price)}</strong>
          {discount > 0 && <del>{formatPKR(product.oldPrice!)}</del>}
        </div>
        <div className="product-card-bottom">
          <span>{product.colors.slice(0, 3).join(" · ") || product.category}</span>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            aria-label={`Shop ${product.name}`}
          >
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
