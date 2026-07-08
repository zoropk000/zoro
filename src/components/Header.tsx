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
          <button
            className="rounded-md p-2 md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-primary sm:text-xl">
              <img src="/logo1.png" alt="StepStyle Pakistan" className="h-16 w-auto object-contain" />
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

            {/* Language Toggle (desktop) */}
            <button
              onClick={toggleLang}
              className="hidden md:flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition"
              aria-label="Toggle language"
            >
              <Globe className="h-4 w-4 text-primary" />
              {t("langToggle")}
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

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <span className="text-lg font-extrabold text-primary">
              <img src="/logo1.png" alt="StepStyle Pakistan" className="h-14 w-auto object-contain" />
            </span>
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
                className="rounded-lg px-4 py-4 text-lg font-semibold text-foreground hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <Link
              to="/track-order"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-4 text-lg text-foreground hover:bg-secondary"
            >
              {t("trackOrder")}
            </Link>
            <Link
              to="/size-guide"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-4 text-lg text-foreground hover:bg-secondary"
            >
              {t("sizeGuide")}
            </Link>
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-4 text-lg text-foreground hover:bg-secondary"
            >
              {t("contactUs")}
            </Link>
            <Link
              to="/faq"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-4 text-lg text-foreground hover:bg-secondary"
            >
              {t("faq")}
            </Link>
            <hr className="my-2 border-border" />
            {/* Language toggle inside mobile menu */}
            <button
              onClick={() => { toggleLang(); setMenuOpen(false); }}
              className="flex items-center gap-2 rounded-lg px-4 py-4 text-lg font-semibold text-primary hover:bg-secondary"
            >
              <Globe className="h-5 w-5" />
              {t("langToggle")}
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
