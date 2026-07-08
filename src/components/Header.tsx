import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart, X, Globe } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/config/siteConfig";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";

export function Header() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, lang, setLang } = useLanguage();
  const isUrdu = lang === "ur";

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
      <div className="announcement-bar w-full bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-2 text-xs sm:gap-4 sm:text-sm">
          <span>{t("announcementDelivery")}</span>
          <span className="hidden sm:inline">•</span>
          <span>{t("announcementCOD")}</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
        <div
          className={`mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:py-3 ${isUrdu ? "flex-row-reverse" : ""
            }`}
        >
          {/* Hamburger - only on mobile */}
          <button
            className="flex-shrink-0 rounded-md p-2 md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex flex-shrink-0 items-center">
            <img
              src="/logo1.png"
              alt={siteConfig.brandName}
              className="h-12 w-auto object-contain sm:h-14"
            />
          </Link>

          {/* Desktop nav */}
          <nav
            className={`desktop-nav hidden items-center gap-3 md:flex ${isUrdu ? "mr-4" : "ml-4"
              }`}
          >
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="nav-link flex-shrink-0 text-sm font-medium text-foreground hover:text-primary"
                activeProps={{ className: "text-primary font-semibold" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Right-side actions (desktop + mobile) */}
          <div
            className={`flex items-center gap-1.5 sm:gap-2 ${isUrdu ? "mr-auto" : "ml-auto"
              }`}
          >
            {/* Desktop search */}
            <Link
              to="/shop"
              className="hidden items-center gap-2 rounded-lg border border-border px-2 py-2 text-sm text-muted-foreground hover:bg-secondary md:flex"
            >
              <Search className="h-4 w-4 flex-shrink-0" />
              <span className="max-w-[120px] truncate">{t("searchPlaceholder")}</span>
            </Link>

            {/* Language toggle - ALWAYS VISIBLE on mobile and desktop */}
            <button
              onClick={toggleLang}
              className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-2 text-xs font-bold text-foreground hover:bg-secondary sm:gap-1.5 sm:px-2.5 sm:text-sm"
              aria-label="Toggle language"
            >
              <Globe className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>{t("langToggle")}</span>
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-2 text-sm font-semibold text-foreground hover:bg-secondary/80"
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
            className={`flex w-full items-center gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm text-muted-foreground ${isUrdu ? "flex-row-reverse" : ""
              }`}
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{t("searchPlaceholder")}</span>
          </Link>
        </div>
      </header>

      {/* Mobile Menu - language toggle removed from here */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-background md:hidden"
          dir={isUrdu ? "rtl" : "ltr"}
        >
          <div
            className={`flex items-center justify-between border-b border-border px-4 py-3 ${isUrdu ? "flex-row-reverse" : ""
              }`}
          >
            <img
              src="/logo1.png"
              alt={siteConfig.brandName}
              className="h-12 w-auto object-contain"
            />
            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-md p-2"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-col p-4">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 font-semibold text-foreground hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <Link
              to="/track-order"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-foreground hover:bg-secondary"
            >
              {t("trackOrder")}
            </Link>
            <Link
              to="/size-guide"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-foreground hover:bg-secondary"
            >
              {t("sizeGuide")}
            </Link>
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-foreground hover:bg-secondary"
            >
              {t("contactUs")}
            </Link>
            <Link
              to="/faq"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-foreground hover:bg-secondary"
            >
              {t("faq")}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
