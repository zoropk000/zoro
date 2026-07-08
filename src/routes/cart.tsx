import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useCart } from "@/lib/cart-context";
import { formatPKR } from "@/lib/currency";
import { calcDeliveryFee } from "@/lib/orders";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart - ZORO" }] }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  const delivery = calcDeliveryFee(subtotal);
  const total = subtotal + delivery;

  if (lines.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className={`font-extrabold ${isUrdu ? "text-xl sm:text-2xl leading-[1.7]" : "text-2xl"}`}>
            {t("cartEmpty")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("cartEmptyText")}</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground"
            style={{ minHeight: "52px" }}
          >
            {t("shopShoesBtn")}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28">
        <h1
          className={`mb-6 font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7] text-right" : "text-3xl"
            }`}
        >
          {t("yourCart")}
        </h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Cart lines */}
          <div className="space-y-4">
            {lines.map((line) => (
              <div
                key={`${line.productId}-${line.size}`}
                className={`flex gap-4 rounded-2xl border border-border bg-card p-4 ${isUrdu ? "flex-row-reverse" : ""
                  }`}
              >
                {/* Product image - always LTR position */}
                <div className="image-overflow h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-28">
                  <img
                    src={line.product.images[0]}
                    alt={line.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className={`flex flex-1 flex-col ${isUrdu ? "text-right items-end" : ""}`}>
                  <Link
                    to="/product/$slug"
                    params={{ slug: line.product.slug }}
                    className="cart-product-name text-base font-bold hover:text-primary sm:text-lg"
                  >
                    {line.product.name}
                  </Link>

                  <div className="cart-size-qty mt-1 text-sm text-muted-foreground">
                    {t("size")}:{" "}
                    <span dir="ltr" className="ltr-content font-semibold">{line.size}</span>
                  </div>

                  <div className="ltr-content mt-1 text-base font-bold">
                    {formatPKR(line.product.price)}
                  </div>

                  <div
                    className={`mt-auto flex flex-wrap items-center justify-between gap-3 pt-3 ${isUrdu ? "flex-row-reverse" : ""
                      }`}
                  >
                    {/* Qty buttons - keep LTR order for numbers */}
                    <div
                      className="inline-flex items-center rounded-lg border border-border"
                      dir="ltr"
                    >
                      <button
                        onClick={() => updateQuantity(line.productId, line.size, line.quantity - 1)}
                        className="p-2 hover:bg-secondary"
                        aria-label="Decrease"
                        style={{ minWidth: "36px", minHeight: "36px" }}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-base font-semibold">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(line.productId, line.size, line.quantity + 1)}
                        className="p-2 hover:bg-secondary"
                        aria-label="Increase"
                        style={{ minWidth: "36px", minHeight: "36px" }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(line.productId, line.size)}
                      className={`inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline ${isUrdu ? "flex-row-reverse" : ""
                        }`}
                    >
                      <Trash2 className="h-4 w-4 flex-shrink-0" /> {t("remove")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <aside className={`h-fit rounded-2xl border border-border bg-card p-5 ${isUrdu ? "text-right" : ""}`}>
            <h2
              className={`mb-4 font-bold ${isUrdu ? "text-lg leading-[1.8]" : "text-lg"}`}
            >
              {t("orderSummary")}
            </h2>

            <div className="space-y-2 text-sm">
              <Row label={t("products")} value={formatPKR(subtotal)} isUrdu={isUrdu} />
              <Row
                label={t("delivery")}
                value={delivery === 0 ? t("freeDelivery") : formatPKR(delivery)}
                isUrdu={isUrdu}
              />
              <div className="my-2 border-t border-border" />
              <Row label={t("total")} value={formatPKR(total)} bold isUrdu={isUrdu} />
            </div>

            <div className="mt-4 rounded-xl bg-success/10 p-3 text-center text-sm font-semibold text-success">
              {t("paymentCOD")}
            </div>

            <Link
              to="/checkout"
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground hover:bg-primary/90"
              style={{ minHeight: "52px" }}
            >
              {t("continueToOrder")}
            </Link>

            <Link
              to="/shop"
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-border py-3 text-sm font-semibold"
              style={{ minHeight: "48px" }}
            >
              {t("continueShopping")}
            </Link>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

function Row({
  label,
  value,
  bold,
  isUrdu,
}: {
  label: string;
  value: string;
  bold?: boolean;
  isUrdu?: boolean;
}) {
  return (
    <div
      className={`flex items-center ${bold ? "text-lg font-extrabold" : ""} ${isUrdu ? "flex-row-reverse" : "justify-between"
        }`}
    >
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span dir="ltr" className="ltr-content">{value}</span>
    </div>
  );
}
