import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPKR } from "@/lib/currency";
import { getDiscount } from "@/data/products";
import { useLanguage } from "@/lib/language-context";

export function ProductCard({ product }: { product: Product }) {
  const discount = getDiscount(product);
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";

  const displayDescription =
    isUrdu && product.shortDescriptionUr
      ? product.shortDescriptionUr
      : product.shortDescription;

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-md"
    >
      {/* Image container - always clip overflow here */}
      <div className="image-overflow relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-0.5 text-xs font-semibold text-sale-foreground sm:left-3 sm:top-3">
            {discount}% OFF
          </span>
        )}
        {product.newArrival && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground sm:right-3 sm:top-3">
            {t("newLabel")}
          </span>
        )}
      </div>

      {/* Text content */}
      <div className={`flex flex-1 flex-col gap-1.5 p-3 sm:p-4 ${isUrdu ? "text-right items-end" : ""}`}>
        <h3
          className={`product-card-name line-clamp-2 font-semibold text-foreground ${isUrdu ? "text-sm leading-[1.9]" : "text-sm sm:text-base"
            }`}
        >
          {product.name}
        </h3>

        {displayDescription && (
          <p
            className={`line-clamp-2 text-xs text-muted-foreground ${isUrdu ? "leading-[1.9]" : ""
              }`}
          >
            {displayDescription}
          </p>
        )}

        <div className={`flex items-center gap-1 text-sm text-muted-foreground ${isUrdu ? "flex-row-reverse justify-end" : ""}`}>
          <Star className="h-4 w-4 flex-shrink-0 fill-accent text-accent" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>({product.reviewCount})</span>
        </div>

        <div className={`flex flex-wrap items-baseline gap-1.5 ${isUrdu ? "flex-row-reverse" : ""}`}>
          <span className="ltr-content text-base font-bold text-foreground sm:text-lg">
            {formatPKR(product.price)}
          </span>
          {product.oldPrice && (
            <span className="ltr-content text-xs text-muted-foreground line-through sm:text-sm">
              {formatPKR(product.oldPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
          <span
            className={`product-card-btn inline-flex w-full items-center justify-center rounded-lg bg-primary px-2 py-2 text-xs font-semibold text-primary-foreground transition group-hover:bg-primary/90 sm:text-sm ${isUrdu ? "min-h-[44px] leading-[1.8]" : ""
              }`}
          >
            {t("viewAndBuy")}
          </span>
        </div>
      </div>
    </Link>
  );
}
