import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Truck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { getProducts, type ProductFilters } from "@/services/productService";
import {
  categoryImage,
  defaultCategories,
  useStorefront,
  type Promotion,
} from "@/services/storefrontService";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "ZORO — Everyday, elevated. | Online Shopping Pakistan" }] }),
  component: HomePage,
});
const slides = [
  {
    eyebrow: "THE EVERYDAY EDIT · 2026",
    title: (
      <>
        Everyday,
        <br />
        <em>elevated.</em>
      </>
    ),
    copy: "Considered style. Unexpected finds. Discover the pieces that feel a little more you.",
    cta: "Explore the collection",
    href: "/shop",
    image: "/images/campaign.webp",
  },
  {
    eyebrow: "FIND YOUR SIGNATURE",
    title: (
      <>
        A lasting
        <br />
        <em>impression.</em>
      </>
    ),
    copy: "From fresh first notes to warm finishes. Find a fragrance that tells your story.",
    cta: "Explore perfumes",
    href: "/shop?category=perfumes",
    image: "/images/category-perfumes.webp",
  },
  {
    eyebrow: "THE FINISHING TOUCH",
    title: (
      <>
        It’s all in
        <br />
        <em>the details.</em>
      </>
    ),
    copy: "The bag. The watch. The perfect pair. Little things that bring everything together.",
    cta: "Shop accessories",
    href: "/shop?category=accessories",
    image: "/images/category-accessories.webp",
  },
];
function HomePage() {
  const [slide, setSlide] = useState(0);
  const [department, setDepartment] = useState("");
  const { data: config } = useStorefront();
  const categories = (config?.categories || defaultCategories).filter((c) => !c.parent);
  const campaign = slides[slide];
  const {
    data: featured,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["home-featured", department],
    queryFn: () => getProducts({ category: department || undefined, limit: 8, sort: "popular" }),
  });
  return (
    <Layout>
      <section
        className={`home-hero hero-slide-${slide}`}
        aria-roledescription="carousel"
        aria-label="ZORO collections"
      >
        <div className="hero-copy">
          <span className="small-eyebrow">
            <i />
            {campaign.eyebrow}
          </span>
          <h1>{campaign.title}</h1>
          <p>{campaign.copy}</p>
          <a href={campaign.href} className="store-button">
            {campaign.cta}
            <ArrowUpRight size={19} />
          </a>
          <div className="hero-bottom">
            <span>YOUR STYLE. YOUR EVERYDAY.</span>
            <div className="hero-controls">
              <button
                aria-label="Previous campaign"
                onClick={() => setSlide((slide + slides.length - 1) % slides.length)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                0{slide + 1}
                <i>/</i>0{slides.length}
              </span>
              <button
                aria-label="Next campaign"
                onClick={() => setSlide((slide + 1) % slides.length)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
        <div className="hero-photo">
          <img
            key={campaign.image}
            src={campaign.image}
            alt={
              slide === 0
                ? "ZORO original campaign: contemporary neutral clothing and everyday style"
                : slide === 1
                  ? "Amber perfume bottles in warm studio light"
                  : "Curated tan bag, watch and sunglasses"
            }
            fetchPriority="high"
            width="1536"
            height="1024"
          />
          <span className="hero-photo-tag">THE NEW WAY TO EVERYDAY</span>
          <div className="hero-photo-caption">
            <span>Made for your kind of day.</span>
            <a href="/shop?collection=new" aria-label="Shop the new collection">
              <ArrowUpRight size={24} />
            </a>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <div>
          <Truck size={16} /> Delivered across Pakistan
        </div>
        <span />
        <div>
          <ShieldCheck size={16} /> Cash on delivery
        </div>
        <span />
        <div>
          <RefreshCw size={16} /> Easy exchange support
        </div>
      </div>
      <section className="store-container home-section category-section">
        <div className="section-heading">
          <div>
            <span className="small-eyebrow">A WORLD OF EVERYDAY FINDS</span>
            <h2>Find your kind of style.</h2>
          </div>
          <a href="/shop" className="text-link">
            Explore all categories <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="category-grid">
          {categories.map((c, index) => (
            <a href={`/shop?category=${c.slug}`} className="category-tile" key={c.slug}>
              <div className="category-image">
                <img
                  src={c.image || categoryImage(c.type)}
                  alt={`Shop ${c.name.toLowerCase()}`}
                  width="600"
                  height="600"
                  loading="lazy"
                />
                <span>0{index + 1}</span>
              </div>
              <div className="category-tile-label">
                <h3>{c.name}</h3>
                <ArrowUpRight size={20} />
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="store-container home-section" id="featured">
        <div className="section-heading">
          <div>
            <span className="small-eyebrow">FEATURED PRODUCTS</span>
            <h2>Your next favourite is here.</h2>
          </div>
          <a href="/shop" className="text-link">
            Shop all <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="collection-tabs" role="tablist" aria-label="Featured departments">
          {[{ name: "All finds", slug: "" }, ...categories].map((c) => (
            <button
              key={c.slug}
              role="tab"
              aria-selected={department === c.slug}
              onClick={() => setDepartment(c.slug)}
              className={department === c.slug ? "active" : ""}
            >
              {c.name}
            </button>
          ))}
        </div>
        {isLoading ? (
          <ProductSkeletons count={8} />
        ) : isError ? (
          <div className="collection-empty">
            <p>We couldn’t load the collection.</p>
            <button onClick={() => refetch()} className="text-link">
              Try again <ArrowRight size={16} />
            </button>
          </div>
        ) : featured?.products.length ? (
          <div className="store-product-grid">
            {featured.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="collection-empty">
            <Sparkles size={26} />
            <h3>A new collection is on its way.</h3>
            <p>Explore our current favourites while we get it ready.</p>
            <a href="/shop" className="text-link">
              Explore all finds <ArrowRight size={16} />
            </a>
          </div>
        )}
      </section>
      <section className="editorial-pair store-container">
        <a href="/men" className="editorial-card editorial-men">
          <img
            src="/images/campaign.webp"
            alt="Modern menswear in warm neutral colours"
            loading="lazy"
          />
          <div>
            <span className="small-eyebrow">THE MEN’S EDIT</span>
            <h2>
              Good days.
              <br />
              Great style.
            </h2>
            <span className="text-link">
              Shop men <ArrowUpRight size={18} />
            </span>
          </div>
        </a>
        <a href="/women" className="editorial-card editorial-women">
          <img
            src="/images/campaign.webp"
            alt="Contemporary womenswear in soft sage and ivory"
            loading="lazy"
          />
          <div>
            <span className="small-eyebrow">THE WOMEN’S EDIT</span>
            <h2>
              Wear it
              <br />
              your way.
            </h2>
            <span className="text-link">
              Shop women <ArrowUpRight size={18} />
            </span>
          </div>
        </a>
      </section>
      <ProductSection
        eyebrow="LOVED FOR A REASON"
        title="The best sellers."
        href="/shop?collection=bestsellers"
        filters={{ bestSeller: true, limit: 4 }}
      />
      <section className="new-season-banner">
        <div className="store-container">
          <span className="small-eyebrow">A FRESH PERSPECTIVE</span>
          <h2>
            New season.
            <br />
            <em>New possibilities.</em>
          </h2>
          <p>Discover something you’ll love putting on.</p>
          <a href="/shop?collection=new" className="store-button">
            Shop new arrivals <ArrowUpRight size={18} />
          </a>
          <span className="season-stamp">
            ZORO
            <br />
            <small>EVERYDAY ESSENTIALS</small>
          </span>
        </div>
      </section>
      <ProductSection
        eyebrow="JUST LANDED"
        title="Meet your new favourites."
        href="/shop?collection=new"
        filters={{ newArrival: true, sort: "newest", limit: 4 }}
      />
      {config?.promotions.map((promotion) => (
        <PromotionBanner key={promotion.id} promotion={promotion} />
      ))}
      <ProductSection
        eyebrow="GOOD FINDS. BETTER PRICES."
        title="The sale edit."
        href="/sale"
        filters={{ onSale: true, sort: "discount", limit: 4 }}
      />
      <section className="store-container home-section editors-section">
        <div className="section-heading">
          <div>
            <span className="small-eyebrow">EDITOR’S CHOICE</span>
            <h2>The finishing touches.</h2>
          </div>
          <span className="section-note">Small details. A whole new feeling.</span>
        </div>
        <div className="editors-grid">
          <a href="/shop?category=perfumes">
            <img src="/images/category-perfumes.webp" alt="The fragrance edit" loading="lazy" />
            <div>
              <span className="small-eyebrow">FIND YOUR SIGNATURE</span>
              <h3>Scents with a story.</h3>
              <span className="text-link">
                Discover perfumes <ArrowUpRight size={18} />
              </span>
            </div>
          </a>
          <a href="/shop?category=accessories">
            <img
              src="/images/category-accessories.webp"
              alt="The accessories edit"
              loading="lazy"
            />
            <div>
              <span className="small-eyebrow">CONSIDER THE DETAILS</span>
              <h3>A little extra you.</h3>
              <span className="text-link">
                Explore accessories <ArrowUpRight size={18} />
              </span>
            </div>
          </a>
        </div>
      </section>
      <ProductSection
        eyebrow="CURATED FOR YOUR EVERYDAY"
        title="We think you’ll love these."
        href="/shop?collection=featured"
        filters={{ featured: true, limit: 4 }}
      />
      <section className="zoro-note store-container">
        <span className="small-eyebrow">THE ZORO WAY</span>
        <h2>
          More than a wardrobe.
          <br />A way to be <em>you.</em>
        </h2>
        <p>
          From what you wear to the details you carry. We bring your everyday favourites together,
          in one place.
        </p>
        <a href="/about" className="text-link">
          A little about us <ArrowUpRight size={17} />
        </a>
      </section>
    </Layout>
  );
}
function ProductSection({
  eyebrow,
  title,
  href,
  filters,
}: {
  eyebrow: string;
  title: string;
  href: string;
  filters: ProductFilters;
}) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home-collection", filters],
    queryFn: () => getProducts(filters),
  });
  if (!isLoading && !isError && !data?.products.length) return null;
  return (
    <section className="store-container home-section">
      <div className="section-heading">
        <div>
          <span className="small-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <a href={href} className="text-link">
          View collection <ArrowUpRight size={17} />
        </a>
      </div>
      {isLoading ? (
        <ProductSkeletons count={4} />
      ) : isError ? (
        <div className="collection-empty">
          <p>This collection is temporarily unavailable.</p>
          <button onClick={() => refetch()} className="text-link">
            Try again
          </button>
        </div>
      ) : (
        <div className="store-product-grid">
          {data?.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
export function ProductSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="store-product-grid" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="product-skeleton">
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
function PromotionBanner({ promotion }: { promotion: Promotion }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = promotion.endsAt && now ? Date.parse(promotion.endsAt) - now : null;
  if (remaining !== null && remaining <= 0) return null;
  const hours = remaining ? Math.floor(remaining / 3600000) : 0,
    minutes = remaining ? Math.floor(remaining / 60000) % 60 : 0,
    seconds = remaining ? Math.floor(remaining / 1000) % 60 : 0;
  return (
    <section className="store-container promotion-banner">
      <div>
        <span className="small-eyebrow">
          {promotion.endsAt ? "LIMITED TIME · SPECIAL OFFER" : "SPECIAL OFFER"}
        </span>
        <h2>{promotion.title}</h2>
        <p>{promotion.subtitle}</p>
        <a
          className="text-link"
          href={`/shop?collection=sale${promotion.category ? `&category=${promotion.category}` : ""}`}
        >
          Shop flash deals <ArrowUpRight size={18} />
        </a>
      </div>
      {remaining !== null && (
        <div className="promotion-countdown" aria-label="Time remaining">
          {[
            [hours, "HOURS"],
            [minutes, "MINUTES"],
            [seconds, "SECONDS"],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{String(value).padStart(2, "0")}</strong>
              <small>{label}</small>
            </div>
          ))}
        </div>
      )}
      {promotion.image && <img src={promotion.image} alt={promotion.title} loading="lazy" />}
    </section>
  );
}
