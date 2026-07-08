import { useMemo, useState } from "react";
import { Layout } from "./Layout";
import { ProductCard } from "./ProductCard";
import { products, type Product } from "@/data/products";
import { Filter, Search, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

type Category = "All" | "Men" | "Women";
type Sort = "popular" | "newest" | "price-asc" | "price-desc";

const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export type ShopFilter = {
  initialCategory?: Category;
  saleOnly?: boolean;
  title?: string;
  subtitle?: string;
};

export function ShopView({ initialCategory = "All", saleOnly = false, title, subtitle }: ShopFilter) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [sizes, setSizes] = useState<number[]>([]);
  const [priceIdx, setPriceIdx] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const PRICE_RANGES = [
    { label: t("priceUnder3k"), min: 0, max: 3000 },
    { label: t("price3to5k"), min: 3000, max: 5000 },
    { label: t("price5to8k"), min: 5000, max: 8000 },
    { label: t("priceAbove8k"), min: 8000, max: Infinity },
  ];

  const CATEGORIES: { key: Category; label: string }[] = [
    { key: "All", label: t("filterAll") },
    { key: "Men", label: t("filterMen") },
    { key: "Women", label: t("filterWomen") },
  ];

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
      list = list.filter((p) => p.gender === category || p.gender === "Unisex");
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
      <FilterGroup label={t("filterCategory")}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                category === c.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup label={t("filterSize")}>
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
      <FilterGroup label={t("filterPrice")}>
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
      <FilterGroup label={t("filterSortBy")}>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm font-medium"
        >
          <option value="popular">{t("sortPopular")}</option>
          <option value="newest">{t("sortNewest")}</option>
          <option value="price-asc">{t("sortPriceLow")}</option>
          <option value="price-desc">{t("sortPriceHigh")}</option>
        </select>
      </FilterGroup>
      <button
        onClick={clearAll}
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-secondary"
      >
        {t("clearFilters")}
      </button>
    </div>
  );

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {title ?? t("allShoesTitle")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {subtitle ?? t("allShoesSub")}
          </p>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-base outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground md:hidden"
          >
            <Filter className="h-4 w-4" />
            {t("filterShoes")}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="hidden md:block">{filtersUI}</aside>
          <div>
            <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("showing")} {filtered.length} {t("shoesCount")}</span>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                <p className="text-lg font-semibold">{t("noShoesFound")}</p>
                <button
                  onClick={clearAll}
                  className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                >
                  {t("viewAllShoes")}
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
            <h3 className="text-lg font-bold">{t("filterShoes")}</h3>
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
              {t("showShoes")} {filtered.length} {t("shoesCount")}
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
