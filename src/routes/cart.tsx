import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useCart } from "@/lib/cart-context";
import { formatPKR } from "@/lib/currency";
import { calcDeliveryFee } from "@/lib/orders";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — StepStyle Pakistan" }] }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();
  const delivery = calcDeliveryFee(subtotal);
  const total = subtotal + delivery;

  if (lines.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold">Your cart is empty.</h1>
          <p className="mt-2 text-muted-foreground">
            Add your favorite shoes and they will appear here.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground"
          >
            Shop Shoes
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-extrabold">Your Shopping Cart</h1>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {lines.map((line) => (
              <div
                key={`${line.productId}-${line.size}`}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-28">
                  <img
                    src={line.product.images[0]}
                    alt={line.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <Link
                    to="/product/$slug"
                    params={{ slug: line.product.slug }}
                    className="text-base font-bold hover:text-primary sm:text-lg"
                  >
                    {line.product.name}
                  </Link>
                  <div className="mt-1 text-sm text-muted-foreground">Size: {line.size}</div>
                  <div className="mt-1 text-base font-bold">{formatPKR(line.product.price)}</div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="inline-flex items-center rounded-lg border border-border">
                      <button
                        onClick={() => updateQuantity(line.productId, line.size, line.quantity - 1)}
                        className="p-2 hover:bg-secondary"
                        aria-label="Decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-base font-semibold">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(line.productId, line.size, line.quantity + 1)}
                        className="p-2 hover:bg-secondary"
                        aria-label="Increase"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(line.productId, line.size)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <Row label="Products" value={formatPKR(subtotal)} />
              <Row label="Delivery" value={delivery === 0 ? "FREE" : formatPKR(delivery)} />
              <div className="my-2 border-t border-border" />
              <Row label="Total" value={formatPKR(total)} bold />
            </div>
            <div className="mt-4 rounded-xl bg-success/10 p-3 text-center text-sm font-semibold text-success">
              💵 Payment: Cash on Delivery
            </div>
            <Link
              to="/checkout"
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground hover:bg-primary/90"
            >
              Continue to Order
            </Link>
            <Link
              to="/shop"
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-border py-3 text-sm font-semibold"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-lg font-extrabold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
