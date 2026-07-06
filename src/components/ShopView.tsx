import { useMemo, useState } from "react";
import { Layout } from "./Layout";
import { ProductCard } from "./ProductCard";
import { products, type Product } from "@/data/products";
import { Filter, Search, X } from "lucide-react";

type Category = "All" | "Men" | "Women" | "Casual" | "Sports" | "Formal" | "Sandals";
type Sort = "popular" | "newest" | "price-asc" | "price-desc";

const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const PRICE_RANGES = [
  { label: "Under Rs. 3,000", min: 0, max: 3000 },
  { label: "Rs. 3,000 – 5,000", min: 3000, max: 5000 },
  { label: "Rs. 5,000 – 8,000", min: 5000, max: 8000 },
  { label: "Above Rs. 8,000", min: 8000, max: Infinity },
];

export type ShopFilter = {
  initialCategory?: Category;
  saleOnly?: boolean;
  title?: string;
  subtitle?: string;
};

export function ShopView({ initialCategory = "All", saleOnly = false, title, subtitle }: ShopFilter) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [sizes, setSizes] = useState<number[]>([]);
  const [priceIdx, setPriceIdx] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list: Product[] = [...products];
    if (saleOnly) list = list.filter((p) => p.oldPrice && p.oldPrice > p.price);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.gender.toLowerCase().includes(q) ||
          p.colors.some((c) => c.toLowerCase().includes(q)) ||
          p.sizes.some((s) => String(s) === q.replace(/[^0-9]/g, "")),
      );
    }
    if (category !== "All") {
      if (category === "Men" || category === "Women") {
        list = list.filter((p) => p.gender === category || p.gender === "Unisex");
      } else {
        list = list.filter((p) => p.category === category);
      }
    }
    if (sizes.length) list = list.filter((p) => sizes.some((s) => p.sizes.includes(s)));
    if (priceIdx !== null) {
      const r = PRICE_RANGES[priceIdx];
      list = list.filter((p) => p.price >= r.min && p.price < r.max);
    }
    switch (sort) {
      case "newest":
        list = list.sort((a, b) => Number(!!b.newArrival) - Number(!!a.newArrival));
        break;
      case "price-asc":
        list = list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = list.sort((a, b) => b.price - a.price);
        break;
      default:
        list = list.sort((a, b) => Number(!!b.bestSeller) - Number(!!a.bestSeller));
    }
    return list;
  }, [query, category, sizes, priceIdx, sort, saleOnly]);

  const clearAll = () => {
    setQuery("");
    setCategory(initialCategory);
    setSizes([]);
    setPriceIdx(null);
    setSort("popular");
  };

  const toggleSize = (s: number) =>
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const filtersUI = (
    <div className="space-y-6">
      <FilterGroup label="Category">
        <div className="flex flex-wrap gap-2">
          {(["All", "Men", "Women", "Casual", "Sports", "Formal", "Sandals"] as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label="Size">
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`h-11 w-11 rounded-lg border text-sm font-semibold transition ${
                sizes.includes(s)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label="Price">
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setPriceIdx(priceIdx === i ? null : i)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                priceIdx === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-secondary"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label="Sort By">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm font-medium"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </FilterGroup>
      <button
        onClick={clearAll}
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-secondary"
      >
        Clear Filters
      </button>
    </div>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {title ?? "All Shoes"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {subtitle ?? "Find the right pair for you"}
          </p>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shoes..."
              className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-base outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground md:hidden"
          >
            <Filter className="h-4 w-4" />
            Filter Shoes
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="hidden md:block">{filtersUI}</aside>
          <div>
            <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filtered.length} Shoes</span>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                <p className="text-lg font-semibold">Sorry, we could not find those shoes.</p>
                <button
                  onClick={clearAll}
                  className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                >
                  View All Shoes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <h3 className="text-lg font-bold">Filter Shoes</h3>
            <button onClick={() => setMobileFiltersOpen(false)} className="rounded-md p-2" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{filtersUI}</div>
          <div className="border-t border-border p-4">
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground"
            >
              Show {filtered.length} Shoes
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">{label}</div>
      {children}
    </div>
  );
}
