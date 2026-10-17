import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Filter, Search, X, ArrowUpRight, ChevronRight } from "lucide-react";
import { Layout } from "./Layout";
import { ProductCard } from "./ProductCard";
import { getProducts } from "@/services/productService";
import { useStorefront, defaultCategories } from "@/services/storefrontService";
import { apiRequest } from "@/services/api";
import { validateShopSearch, type ShopSearch } from "@/lib/shop-search";

export type ShopFilter = {
  initialCategory?: "All" | "Men" | "Women";
  saleOnly?: boolean;
  title?: string;
  subtitle?: string;
};
type Facets = { sizes: string[]; brands: string[]; colors: string[]; fragranceTypes: string[] };
export function ShopView({
  initialCategory = "All",
  saleOnly = false,
  title,
  subtitle,
}: ShopFilter) {
  const rawSearch = useSearch({ strict: false });
  const search = validateShopSearch(rawSearch);
  const navigate = useNavigate();
  const gender =
    search.gender ||
    (initialCategory === "All" ? undefined : (initialCategory.toLowerCase() as "men" | "women"));
  const [query, setQuery] = useState(search.q || "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: config } = useStorefront();
  const categories = config?.categories || defaultCategories;
  const category = categories.find((c) => c.slug === search.category);
  const isPerfume = category?.type === "perfumes";
  const isSized = ["shoes", "clothing"].includes(category?.type || "");
  const collection = saleOnly ? "sale" : search.collection;
  const page = Math.max(1, Math.floor(search.page || 1));
  const sort = search.sort || (collection === "new" ? "newest" : "popular");
  const update = (values: Partial<ShopSearch>) => {
    navigate({
      to: "/shop",
      search: validateShopSearch({ ...search, gender, collection, page: 1, ...values }),
    });
  };
  useEffect(() => {
    setQuery(search.q || "");
  }, [search.q]);
  useEffect(() => {
    if (query === (search.q || "")) return;
    const timer = setTimeout(() => update({ q: query.trim() || undefined }), 350);
    return () => clearTimeout(timer);
  }, [query, search.q]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", escape);
    };
  }, [mobileOpen]);
  const { data: facets } = useQuery({
    queryKey: ["catalog-facets", search.category, gender],
    queryFn: () =>
      apiRequest<Facets>(
        `/storefront/facets?${new URLSearchParams({ ...(search.category ? { category: search.category } : {}), ...(gender ? { gender } : {}) })}`,
      ),
    staleTime: 60_000,
  });
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["catalog", search, gender, collection, page],
    queryFn: () =>
      getProducts({
        page,
        limit: 24,
        search: search.q,
        category: search.category,
        subcategory: search.subcategory,
        gender,
        onSale: collection === "sale" || undefined,
        bestSeller: collection === "bestsellers" || undefined,
        newArrival: collection === "new" || undefined,
        featured: collection === "featured" || undefined,
        sort,
        size: isSized ? search.size : undefined,
        bottleSize: isPerfume ? search.bottleSize : undefined,
        fragranceType: isPerfume ? search.fragranceType : undefined,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        brand: search.brand,
        color: search.color,
        rating: search.rating,
        availability: search.availability,
      }),
  });
  const clear = () => navigate({ to: "/shop", search: { gender, collection } });
  const titleText =
    title ||
    (search.q
      ? `Results for “${search.q}”`
      : category
        ? `${category.name}.`
        : {
            new: "Fresh arrivals.",
            bestsellers: "The best sellers.",
            featured: "Our favourite finds.",
            sale: "The sale edit.",
          }[collection || ""] || "Find your everyday.");
  const activeEntries = Object.entries(search).filter(
    ([key, value]) => !["page", "sort", "collection", "q"].includes(key) && value !== undefined,
  );
  const filters = (
    <>
      <FilterGroup title="Shop by category">
        <div className="filter-category">
          <button
            className={!search.category ? "selected" : ""}
            onClick={() =>
              update({
                category: undefined,
                subcategory: undefined,
                size: undefined,
                bottleSize: undefined,
                fragranceType: undefined,
              })
            }
          >
            All departments
          </button>
          {categories
            .filter((c) => !c.parent)
            .map((c) => (
              <button
                key={c.slug}
                className={search.category === c.slug ? "selected" : ""}
                onClick={() =>
                  update({
                    category: c.slug,
                    subcategory: undefined,
                    size: undefined,
                    bottleSize: undefined,
                    fragranceType: undefined,
                  })
                }
              >
                {c.name}
              </button>
            ))}
        </div>
      </FilterGroup>
      {search.category && (
        <FilterGroup title="Category">
          <select
            aria-label="Subcategory"
            value={search.subcategory || ""}
            onChange={(e) => update({ subcategory: e.target.value || undefined })}
          >
            <option value="">All {category?.name.toLowerCase()}</option>
            {categories
              .filter((c) => c.parent === search.category)
              .map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
          </select>
        </FilterGroup>
      )}
      <FilterGroup title="For">
        <select
          aria-label="Shop by gender"
          value={gender || ""}
          onChange={(e) =>
            update({ gender: (e.target.value as ShopSearch["gender"]) || undefined })
          }
        >
          <option value="">Everyone</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="unisex">Unisex</option>
        </select>
      </FilterGroup>
      <FilterGroup title="Price range (PKR)">
        <div className="flex gap-2">
          <input
            aria-label="Minimum price"
            type="number"
            min="0"
            placeholder="Min"
            value={search.minPrice ?? ""}
            onChange={(e) =>
              update({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
          <input
            aria-label="Maximum price"
            type="number"
            min="0"
            placeholder="Max"
            value={search.maxPrice ?? ""}
            onChange={(e) =>
              update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </FilterGroup>
      <FilterGroup title="Brand">
        <select
          aria-label="Brand"
          value={search.brand || ""}
          onChange={(e) => update({ brand: e.target.value || undefined })}
        >
          <option value="">All brands</option>
          {[...new Set([...(config?.brands || []), ...(facets?.brands || [])])]
            .sort()
            .map((brand) => (
              <option key={brand}>{brand}</option>
            ))}
        </select>
      </FilterGroup>
      {isSized && (
        <FilterGroup title={category?.type === "shoes" ? "Shoe size" : "Clothing size"}>
          <div className="filter-sizes">
            {(facets?.sizes.length
              ? facets.sizes
              : category?.type === "shoes"
                ? ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]
                : ["XS", "S", "M", "L", "XL", "XXL"]
            ).map((size) => (
              <button
                key={size}
                aria-pressed={search.size === size}
                className={search.size === size ? "selected" : ""}
                onClick={() => update({ size: search.size === size ? undefined : size })}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}
      {isPerfume && (
        <>
          <FilterGroup title="Bottle size">
            <select
              aria-label="Bottle size"
              value={search.bottleSize || ""}
              onChange={(e) => update({ bottleSize: e.target.value || undefined })}
            >
              <option value="">All volumes</option>
              {(facets?.sizes.length ? facets.sizes : ["30ml", "50ml", "100ml", "200ml"]).map(
                (size) => (
                  <option key={size}>{size}</option>
                ),
              )}
            </select>
          </FilterGroup>
          <FilterGroup title="Fragrance type">
            <select
              aria-label="Fragrance type"
              value={search.fragranceType || ""}
              onChange={(e) => update({ fragranceType: e.target.value || undefined })}
            >
              <option value="">All types</option>
              {[
                ...new Set([
                  "Eau de Parfum",
                  "Eau de Toilette",
                  "Parfum",
                  "Body Mist",
                  "Attar",
                  ...(facets?.fragranceTypes || []),
                ]),
              ].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </FilterGroup>
        </>
      )}
      <FilterGroup title="Colour">
        <select
          aria-label="Colour"
          value={search.color || ""}
          onChange={(e) => update({ color: e.target.value || undefined })}
        >
          <option value="">All colours</option>
          {(facets?.colors || []).map((color) => (
            <option key={color}>{color}</option>
          ))}
        </select>
      </FilterGroup>
      <FilterGroup title="Availability">
        <label>
          <input
            type="checkbox"
            checked={search.availability === "in-stock"}
            onChange={(e) => update({ availability: e.target.checked ? "in-stock" : undefined })}
          />
          In stock only
        </label>
      </FilterGroup>
      <FilterGroup title="Customer rating">
        <select
          aria-label="Minimum customer rating"
          value={search.rating || ""}
          onChange={(e) => update({ rating: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">All ratings</option>
          <option value="4">4 stars & above</option>
          <option value="3">3 stars & above</option>
        </select>
      </FilterGroup>
      <button className="filter-reset" onClick={clear}>
        Clear all filters
      </button>
    </>
  );
  return (
    <Layout>
      <div className="catalog-header">
        <div className="store-container">
          <div className="breadcrumbs">
            <a href="/">Home</a>
            <ChevronRight size={10} />
            <span>{category?.name || "Shop"}</span>
          </div>
          <span className="small-eyebrow">THE ZORO COLLECTION</span>
          <h1>{titleText}</h1>
          <p>{subtitle || "Considered pieces, great finds, and a little more you."}</p>
        </div>
      </div>
      <div className="store-container catalog-layout">
        <aside className="catalog-sidebar">{filters}</aside>
        <div className="catalog-products">
          <form
            className="mb-5 flex items-center gap-3 border border-border px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: query.trim() || undefined });
            }}
          >
            <Search size={16} />
            <input
              className="min-w-0 flex-1 bg-transparent py-1 text-xs outline-none"
              aria-label="Search this collection"
              placeholder="Search this collection…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" aria-label="Search collection">
              <ArrowUpRight size={16} />
            </button>
          </form>
          <div className="catalog-toolbar">
            <span aria-live="polite">
              {isFetching ? "Finding your favourites…" : `${data?.pagination.total || 0} products`}
            </span>
            <button className="mobile-filter-button" onClick={() => setMobileOpen(true)}>
              <Filter size={13} />
              Filters
            </button>
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="popular">Most popular</option>
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="discount">Biggest discounts</option>
            </select>
          </div>
          {activeEntries.length > 0 && (
            <div className="active-filters">
              {activeEntries.map(([key, value]) => (
                <button
                  key={key}
                  aria-label={`Remove ${key} filter`}
                  onClick={() =>
                    update({
                      [key]: undefined,
                      ...(key === "category"
                        ? {
                            subcategory: undefined,
                            size: undefined,
                            bottleSize: undefined,
                            fragranceType: undefined,
                          }
                        : {}),
                    })
                  }
                >
                  {String(value)}
                  <X size={11} />
                </button>
              ))}
            </div>
          )}
          {isLoading ? (
            <div className="store-product-grid">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="product-skeleton" key={i}>
                  <div />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="collection-empty">
              <h3>We couldn’t load this collection.</h3>
              <p>Please try again in a moment.</p>
              <button className="text-link" onClick={() => refetch()}>
                Try again
              </button>
            </div>
          ) : !data?.products.length ? (
            <div className="collection-empty">
              <Search size={25} />
              <h3>No finds just yet.</h3>
              <p>Try another search or give your filters a little room.</p>
              <button className="text-link" onClick={clear}>
                Clear filters <ArrowUpRight size={15} />
              </button>
            </div>
          ) : (
            <>
              <div className="store-product-grid">
                {data.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {data.pagination.pages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => update({ page: page - 1 })}>
                    Previous
                  </button>
                  <span>
                    Page {page} of {data.pagination.pages}
                  </span>
                  <button
                    disabled={page >= data.pagination.pages}
                    onClick={() => update({ page: page + 1 })}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {mobileOpen && (
        <div
          className="mobile-filter-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
        >
          <header>
            <h2>Find your favourites</h2>
            <button aria-label="Close filters" onClick={() => setMobileOpen(false)} autoFocus>
              <X size={22} />
            </button>
          </header>
          <div>{filters}</div>
          <button className="store-button" onClick={() => setMobileOpen(false)}>
            Show {data?.pagination.total || 0} products <ArrowUpRight size={17} />
          </button>
        </div>
      )}
    </Layout>
  );
}
function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="filter-group">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
