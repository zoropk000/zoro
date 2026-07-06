import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/config/siteConfig";
import { useCart } from "@/lib/cart-context";

export function Header() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    { to: "/", label: "Home" },
    { to: "/men", label: "Men" },
    { to: "/women", label: "Women" },
    { to: "/shop", label: "All Shoes" },
    { to: "/sale", label: "Sale" },
  ] as const;

  return (
    <>
      <div className="w-full bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-2 text-xs sm:text-sm">
          <span>🚚 Delivery All Over Pakistan</span>
          <span className="hidden sm:inline">•</span>
          <span>💵 Cash on Delivery Available</span>
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
              {siteConfig.brandName}
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
            <Link
              to="/shop"
              className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary md:flex"
            >
              <Search className="h-4 w-4" />
              Search shoes...
            </Link>
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/80"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
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
            Search shoes...
          </Link>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <span className="text-lg font-extrabold text-primary">{siteConfig.brandName}</span>
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
              Track Order
            </Link>
            <Link
              to="/size-guide"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-4 text-lg text-foreground hover:bg-secondary"
            >
              Size Guide
            </Link>
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-4 text-lg text-foreground hover:bg-secondary"
            >
              Contact Us
            </Link>
            <Link
              to="/faq"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-4 text-lg text-foreground hover:bg-secondary"
            >
              FAQ
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
