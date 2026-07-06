import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { reviews } from "@/data/reviews";
import { siteConfig } from "@/config/siteConfig";
import { MessageCircle, ShieldCheck, Truck, Wallet, RefreshCw, Headphones, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const bestSellers = products.filter((p) => p.bestSeller).slice(0, 8);

  const categories = [
    { title: "Men's Shoes", to: "/men", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80" },
    { title: "Women's Shoes", to: "/women", img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80" },
    { title: "Casual Shoes", to: "/shop", img: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=800&q=80" },
    { title: "Sports Shoes", to: "/shop", img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80" },
    { title: "Sale", to: "/sale", img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-secondary/50">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:py-16 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-foreground sm:text-5xl md:text-6xl">
              Find Your Perfect Pair
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Comfortable shoes delivered anywhere in Pakistan.
              <br />
              <span className="font-semibold text-foreground">Pay cash when your order arrives.</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90"
              >
                Shop Shoes
              </Link>
              <Link
                to="/sale"
                className="rounded-xl border border-primary bg-background px-6 py-4 text-base font-bold text-primary hover:bg-secondary"
              >
                View Sale
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <TrustPoint icon={<Truck className="h-5 w-5" />} label="Delivery Across Pakistan" />
              <TrustPoint icon={<Wallet className="h-5 w-5" />} label="Cash on Delivery" />
              <TrustPoint icon={<RefreshCw className="h-5 w-5" />} label="Easy Size Exchange" />
            </div>
          </div>
          <div className="relative order-first aspect-square overflow-hidden rounded-3xl bg-background shadow-xl md:order-none">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80"
              alt="Comfortable red running shoes"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle title="Shop by Category" subtitle="Pick a category to start" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className="group relative overflow-hidden rounded-2xl bg-secondary"
            >
              <div className="aspect-square">
                <img src={c.img} alt={c.title} className="h-full w-full object-cover transition group-hover:scale-105" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="text-base font-bold text-white sm:text-lg">{c.title}</div>
                <div className="mt-1 text-xs font-semibold text-white/90">Shop Now →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-secondary/40 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title="Best Sellers" subtitle="Loved by customers across Pakistan" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* How to Order */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionTitle title="How to Order" subtitle="Ordering is very easy - just 3 simple steps" />
        <div className="grid gap-6 md:grid-cols-3">
          <Step n={1} title="Choose Your Shoes" text="Select the shoe and your size." />
          <Step n={2} title="Enter Your Details" text="Enter your name, phone number, and address." />
          <Step n={3} title="Pay on Delivery" text="Pay cash when your order arrives at your door." />
        </div>
        <div className="mt-6 rounded-2xl bg-success/10 p-4 text-center text-sm font-semibold text-success sm:text-base">
          💵 No Online Payment Required - آن لائن پیمنٹ کی ضرورت نہیں
        </div>
      </section>

      {/* Why Trust Us */}
      <section className="bg-secondary/40 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title="Why Customers Trust Us" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TrustCard icon={<ShieldCheck className="h-6 w-6" />} title="Original Quality" text="Every pair is checked before shipping." />
            <TrustCard icon={<Wallet className="h-6 w-6" />} title="Cash on Delivery" text="Pay only when your order arrives." />
            <TrustCard icon={<RefreshCw className="h-6 w-6" />} title="Easy Size Exchange" text="Wrong size? We help with exchanges." />
            <TrustCard icon={<Headphones className="h-6 w-6" />} title="Customer Support" text="Message us on WhatsApp any time." />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle title="Customer Reviews" subtitle="Real feedback from Pakistani customers" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 flex">
                {Array.from({ length: r.rating }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-foreground">{r.text}</p>
              <div className="mt-3 text-xs font-semibold text-muted-foreground">
                - {r.name}, {r.city}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp Help */}
      <section className="bg-primary py-12 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Need Help Choosing Your Size?</h2>
          <p className="mt-3 text-primary-foreground/80">
            Message us on WhatsApp. We will help you choose the right shoes.
          </p>
          <a
            href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent("Assalamualaikum, I need help choosing my shoe size.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-4 text-base font-bold text-whatsapp-foreground hover:opacity-90"
          >
            <MessageCircle className="h-5 w-5" />
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </Layout>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 text-center sm:mb-8">
      <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
    </div>
  );
}

function TrustPoint({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm font-medium text-foreground">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

function TrustCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-base font-bold text-foreground">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{text}</div>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-extrabold text-accent-foreground">
        {n}
      </div>
      <div className="text-lg font-bold text-foreground">{title}</div>
      <div className="mt-2 text-sm text-muted-foreground">{text}</div>
    </div>
  );
}
