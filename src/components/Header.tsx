import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, Globe, Package } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";

export function Header() {
  const { count } = useCart();

  const { t, lang, setLang } = useLanguage();

  const nav = [
    { to: "/", label: t("home") },
    { to: "/men", label: t("men") },
    { to: "/women", label: t("women") },
    { to: "/shop", label: t("allShoes") },
    { to: "/sale", label: t("sale") },
  ] as const;

  const toggleLang = () => setLang(lang === "en" ? "ur" : "en");

  return (
    <>
      {/* Announcement bar */}
      <div className="w-full bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-2 text-xs sm:text-sm">
          <span>{t("announcementDelivery")}</span>
          <span className="hidden sm:inline">•</span>
          <span>{t("announcementCOD")}</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-primary sm:text-xl">
              <img src="/logo1.png" alt="ZORO" className="h-16 w-auto object-contain" />
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-6 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm font-medium text-foreground hover:text-primary"
                activeProps={{ className: "text-primary font-semibold" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Search bar (desktop) */}
            <Link
              to="/shop"
              className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary md:flex"
            >
              <Search className="h-4 w-4" />
              {t("searchPlaceholder")}
            </Link>

            {/* Track Order */}
            <Link
              to="/track-order"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition"
              aria-label="Track Order"
            >
              <Package className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">{t("trackOrder")}</span>
            </Link>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition"
              aria-label="Toggle language"
            >
              <Globe className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">{t("langToggle")}</span>
              <span className="sm:hidden">{lang === "en" ? "EN" : "UR"}</span>
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/80"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">{t("cart")}</span>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="border-t border-border px-4 py-2 md:hidden">
          <Link
            to="/shop"
            className="flex w-full items-center gap-2 rounded-lg bg-secondary px-3 py-3 text-sm text-muted-foreground"
          >
            <Search className="h-4 w-4" />
            {t("searchPlaceholder")}
          </Link>
        </div>
      </header>

    </>
  );
}
