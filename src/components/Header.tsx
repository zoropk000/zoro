import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Search,
  ShoppingBag,
  Heart,
  UserRound,
  Menu,
  X,
  ChevronDown,
  Truck,
  Globe,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCustomer } from "@/lib/customer-context";
import { useLanguage } from "@/lib/language-context";
import { getProducts } from "@/services/productService";
import { defaultCategories, useStorefront } from "@/services/storefrontService";
import { formatPKR } from "@/lib/currency";
import { siteConfig } from "@/config/siteConfig";

export function Header() {
  const { count } = useCart();
  const { wishlist, customer } = useCustomer();
  const { lang, setLang } = useLanguage();
  const { data: config } = useStorefront();
  const categories = config?.categories || defaultCategories;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const { data, isFetching } = useQuery({
    queryKey: ["search-suggestions", debounced],
    queryFn: () => getProducts({ search: debounced, limit: 5 }),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });
  const links = [
    { label: "Home", href: "/" },
    { label: "Men", href: "/men" },
    { label: "Women", href: "/women" },
    ...categories
      .filter((c) => !c.parent)
      .map((c) => ({
        label: c.name,
        href: `/shop?category=${encodeURIComponent(c.slug)}`,
        slug: c.slug,
      })),
    { label: "New Arrivals", href: "/shop?collection=new" },
    { label: "Sale", href: "/sale" },
  ];
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="announcement">
        <div className="store-container">
          <span>
            <Truck size={14} /> Free delivery on orders over{" "}
            {formatPKR(config?.shipping?.freeThreshold ?? siteConfig.freeDeliveryThreshold)}
          </span>
          <span className="announcement-center">A little everyday. A little extraordinary.</span>
          <Link to="/track-order">
            Track your order <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
      <header className="store-header">
        <div className="store-container header-main">
          <button
            className="icon-button mobile-menu-button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
          <Link to="/" className="brand-wordmark" aria-label="ZORO home">
            ZORO<span>PK</span>
          </Link>
          <div className="header-search" ref={searchRef}>
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                setFocused(false);
                navigate({ to: "/shop", search: { q: query.trim() } });
              }}
            >
              <Search size={19} />
              <input
                aria-label="Search products"
                type="search"
                placeholder="Search for your next favourite…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setFocused(true);
                }}
                onClick={() => setFocused(true)}
                onFocus={() => setFocused(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setFocused(false);
                }}
              />
              <button type="submit" aria-label="Submit product search">
                <ArrowUpRight size={19} />
              </button>
            </form>
            {focused && debounced.length >= 2 && (
              <div className="search-suggestions">
                <div className="small-eyebrow">{isFetching ? "Searching…" : "PRODUCTS"}</div>
                {data?.products.map((p) => (
                  <Link
                    key={p.id}
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    onClick={() => setFocused(false)}
                  >
                    <img src={p.images[0] || "/logo.png"} alt="" />
                    <span>
                      {p.name}
                      <small>{formatPKR(p.price)}</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
                {!isFetching && !data?.products.length && (
                  <p>No matches yet. Try a category or another keyword.</p>
                )}
                <a href={`/shop?q=${encodeURIComponent(query)}`} className="search-all">
                  See all results <ArrowUpRight size={15} />
                </a>
              </div>
            )}
          </div>
          <div className="header-actions">
            <Link to="/account" className="header-action" aria-label="My account">
              <UserRound />
              <span>
                <small>Hello{customer ? `, ${customer.name.split(" ")[0]}` : ", welcome"}</small>My
                account
              </span>
            </Link>
            <Link
              to="/wishlist"
              className="icon-button counter-icon"
              aria-label={`Wishlist, ${wishlist.length} items`}
            >
              <Heart />
              {wishlist.length > 0 && <b>{wishlist.length}</b>}
            </Link>
            <span className="header-divider" />
            <Link
              to="/cart"
              className="header-action counter-icon"
              aria-label={`Shopping bag, ${count} items`}
            >
              <ShoppingBag />
              <span>
                <small>Your everyday finds</small>Shopping bag{count > 0 && ` (${count})`}
              </span>
              {count > 0 && <b className="mobile-count">{count}</b>}
            </Link>
          </div>
        </div>
        <div className="header-nav-wrap">
          <div className="store-container nav-container">
            <nav aria-label="Main navigation" className={`desktop-nav ${open ? "nav-open" : ""}`}>
              {links.map((link) => (
                <div className="nav-item" key={link.href}>
                  <a
                    href={link.href}
                    className={link.label === "Sale" ? "sale-link" : ""}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                    {"slug" in link && <ChevronDown size={11} />}
                    {link.label === "Sale" && <span className="sale-dot" />}
                  </a>
                  {"slug" in link && (
                    <div className="nav-dropdown">
                      {categories
                        .filter((c) => c.parent === link.slug)
                        .map((c) => (
                          <a
                            key={c.slug}
                            href={`/shop?category=${link.slug}&subcategory=${c.slug}`}
                          >
                            {c.name}
                            <ArrowUpRight size={12} />
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <button
              className="language-button"
              onClick={() => setLang(lang === "en" ? "ur" : "en")}
              aria-label="Change language"
            >
              <Globe size={14} />
              {lang === "en" ? "English / اردو" : "English"}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
