import { Link } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";

export function MobileBottomNav() {
  const { count } = useCart();
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";

  const item =
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground";
  const active = { className: item + " text-primary" };

  return (
    <nav
      className={`fixed-bottom-nav fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background md:hidden ${
        isUrdu ? "flex-row-reverse" : ""
      }`}
    >
      <Link to="/" className={item} activeOptions={{ exact: true }} activeProps={active}>
        <Home className="h-5 w-5 flex-shrink-0" />
        <span className="mobile-nav-label text-xs font-medium">{t("navHome")}</span>
      </Link>
      <Link to="/shop" className={item} activeProps={active}>
        <ShoppingBag className="h-5 w-5 flex-shrink-0" />
        <span className="mobile-nav-label text-xs font-medium">{t("navShop")}</span>
      </Link>
      <Link to="/shop" className={item}>
        <Search className="h-5 w-5 flex-shrink-0" />
        <span className="mobile-nav-label text-xs font-medium">{t("navSearch")}</span>
      </Link>
      <Link to="/cart" className={`${item} relative`} activeProps={active}>
        <div className="relative">
          <ShoppingCart className="h-5 w-5 flex-shrink-0" />
          {count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {count}
            </span>
          )}
        </div>
        <span className="mobile-nav-label text-xs font-medium">{t("navCart")}</span>
      </Link>
    </nav>
  );
}
