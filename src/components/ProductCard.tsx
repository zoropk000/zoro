import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPKR } from "@/lib/currency";
import { getDiscount } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
  const discount = getDiscount(product);
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-sale px-2.5 py-1 text-xs font-semibold text-sale-foreground">
            {discount}% OFF
          </span>
        )}
        {product.newArrival && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            New
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-foreground sm:text-lg">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-accent text-accent" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>({product.reviewCount})</span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">{formatPKR(product.price)}</span>
          {product.oldPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPKR(product.oldPrice)}
            </span>
          )}
        </div>
        <div className="mt-auto pt-3">
          <span className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition group-hover:bg-primary/90">
            View & Buy
          </span>
        </div>
      </div>
    </Link>
  );
}
