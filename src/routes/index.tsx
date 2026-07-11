import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/services/productService";
import { reviews } from "@/data/reviews";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";
import {
  MessageCircle,
  ShieldCheck,
  Truck,
  Wallet,
  RefreshCw,
  Headphones,
  Star,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { trackOrder } from "@/services/orderService";

// Temporary transparent placeholder. Replace with the real ZORO product cutout before production.
const unboxingShoeImage = "https://pngimg.com/uploads/running_shoes/running_shoes_PNG5822.png";

const HOME_CATEGORIES = [
  {
    titleKey: "menShoes" as const,
    to: "/men" as const,
    img: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1200&q=82",
    srcSet:
      "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=640&q=80 640w, https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=960&q=82 960w, https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1200&q=82 1200w",
  },
  {
    titleKey: "womenShoes" as const,
    to: "/women" as const,
    img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=82",
    srcSet:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=640&q=80 640w, https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=960&q=82 960w, https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=82 1200w",
  },
];

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useLanguage();
  const pageRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home-best-sellers"],
    queryFn: async () => {
      const featured = await getProducts({ featured: true, limit: 8 });
      if (featured.products.length > 0) return featured;
      return getProducts({ limit: 8, sort: "newest" });
    },
  });
  const bestSellers = data?.products || [];

  const [lastOrder, setLastOrder] = useState<{ orderNumber: string; phone: string } | null>(null);

  useEffect(() => {
    try {
      const recentOrders = JSON.parse(localStorage.getItem("recentOrders") || "[]");
      if (recentOrders && recentOrders.length > 0) {
        setLastOrder(recentOrders[recentOrders.length - 1]);
      }
    } catch (err) {
      console.error("Failed to load recent orders", err);
    }
  }, []);

  useEffect(() => {
    let animationContext: { revert: () => void } | undefined;
    const revealAnimations = new Set<Animation>();
    let cancelled = false;

    const root = pageRef.current;
    if (
      typeof window === "undefined" ||
      !root ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const getRevealItems = (target: HTMLElement) => {
      if (target.hasAttribute("data-product-reveal")) {
        return Array.from(target.querySelectorAll<HTMLElement>("[data-product-grid] > *"));
      }

      return Array.from(target.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement,
      );
    };

    const revealTargets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal-group], [data-product-reveal]"),
    );

    revealTargets.forEach((target) => {
      getRevealItems(target).forEach((item) => {
        item.style.opacity = "0";
        item.style.transform = "translate3d(0, 18px, 0)";
      });
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const target = entry.target as HTMLElement;
          const items = getRevealItems(target);

          items.forEach((item, index) => {
            item.style.opacity = "0";
            item.style.transform = "translate3d(0, 18px, 0)";

            const animation = item.animate(
              [
                { opacity: 0, transform: "translate3d(0, 18px, 0)" },
                { opacity: 1, transform: "translate3d(0, 0, 0)" },
              ],
              {
                duration: 460,
                delay: Math.min(index, 7) * 42,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "forwards",
              },
            );

            revealAnimations.add(animation);
            animation.onfinish = () => {
              item.style.opacity = "1";
              item.style.transform = "";
              revealAnimations.delete(animation);
              animation.cancel();
            };
            animation.oncancel = () => revealAnimations.delete(animation);
          });

          revealObserver?.unobserve(target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    revealTargets.forEach((target) => revealObserver?.observe(target));

    const setupAnimations = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled || !pageRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      animationContext = gsap.context(() => {
        const q = gsap.utils.selector(root);
        const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        const heroLogo = q("[data-hero-logo]");

        if (heroLogo.length) {
          heroTimeline.fromTo(
            heroLogo,
            { autoAlpha: 0, y: 14, scale: 0.96 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.55 },
          );
        }

        heroTimeline
          .fromTo(
            q("[data-hero-eyebrow]"),
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.45 },
            heroLogo.length ? "-=0.3" : 0,
          )
          .fromTo(
            q("[data-hero-title]"),
            { autoAlpha: 0, y: 34 },
            { autoAlpha: 1, y: 0, duration: 0.72 },
            "-=0.18",
          )
          .fromTo(
            q("[data-hero-secondary]"),
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.07 },
            "-=0.42",
          )
          .fromTo(
            q("[data-hero-visual]"),
            { autoAlpha: 0, scale: 0.975 },
            { autoAlpha: 1, scale: 1, duration: 0.85 },
            "-=0.76",
          )
          .fromTo(
            q("[data-hero-detail]"),
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.58, stagger: 0.08 },
            "-=0.48",
          );

        const unboxSection = q("[data-unbox-section]")[0] as HTMLElement | undefined;
        const unboxStage = q("[data-unbox-stage]")[0] as HTMLElement | undefined;
        const unboxScene = q("[data-unbox-scene]")[0] as HTMLElement | undefined;
        const boxWrap = q("[data-box-wrap]")[0] as HTMLElement | undefined;
        const boxLid = q("[data-box-lid]")[0] as HTMLElement | undefined;
        const shoe = q("[data-unbox-shoe]")[0] as HTMLElement | undefined;
        const shoeGlow = q("[data-shoe-glow]")[0] as HTMLElement | undefined;
        const floorShadow = q("[data-floor-shadow]")[0] as HTMLElement | undefined;
        const progress = q("[data-unbox-progress]")[0] as HTMLElement | undefined;

        if (
          unboxSection &&
          unboxStage &&
          unboxScene &&
          boxWrap &&
          boxLid &&
          shoe &&
          shoeGlow &&
          floorShadow &&
          progress
        ) {
          gsap.set(unboxStage, { perspective: 1600 });
          gsap.set(unboxScene, {
            transformPerspective: 1600,
            transformStyle: "preserve-3d",
          });
          gsap.set(boxWrap, {
            autoAlpha: 1,
            yPercent: 15,
            scale: 0.84,
            rotateX: 7,
            transformPerspective: 1500,
            transformStyle: "preserve-3d",
            force3D: true,
          });
          gsap.set(boxLid, {
            xPercent: -50,
            rotateX: 0,
            yPercent: 0,
            z: 24,
            transformOrigin: "50% 100%",
            transformPerspective: 1500,
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            force3D: true,
          });
          gsap.set(shoe, {
            xPercent: -50,
            autoAlpha: 0,
            yPercent: 58,
            scale: 0.72,
            rotation: -3,
            z: 40,
            transformOrigin: "50% 65%",
            force3D: true,
          });
          gsap.set(shoeGlow, { autoAlpha: 0, scale: 0.72 });
          gsap.set(floorShadow, { autoAlpha: 0.28, scaleX: 0.82, scaleY: 0.72 });
          gsap.set(progress, { scaleY: 0, transformOrigin: "50% 100%" });

          const getScrollDistance = () => {
            const viewportFactor = window.innerWidth < 768 ? 3.25 : 4.1;
            const minimum = window.innerWidth < 768 ? 2400 : 3200;
            return Math.max(Math.round(window.innerHeight * viewportFactor), minimum);
          };

          const unboxTimeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: unboxSection,
              start: "top top",
              end: () => `+=${getScrollDistance()}`,
              scrub: true,
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
            },
          });

          unboxTimeline
            // 1. Closed box enters and becomes the full-screen focus.
            .to(progress, { scaleY: 1, duration: 1 }, 0)
            .to(
              boxWrap,
              {
                yPercent: 0,
                scale: 1,
                rotateX: 0,
                duration: 0.16,
                ease: "power2.out",
              },
              0,
            )
            .to(
              floorShadow,
              {
                autoAlpha: 0.44,
                scaleX: 1.02,
                scaleY: 0.9,
                duration: 0.16,
                ease: "power2.out",
              },
              0,
            )
            .to(boxWrap, { yPercent: -2, scale: 1.055, duration: 0.12, ease: "power1.inOut" }, 0.14)

            // 2. The lid opens around its real rear hinge. The shoe remains hidden.
            .to(
              boxLid,
              {
                rotateX: -56,
                yPercent: -4,
                z: -24,
                duration: 0.16,
                ease: "power2.inOut",
              },
              0.24,
            )
            .to(
              boxLid,
              {
                rotateX: -106,
                yPercent: -10,
                z: -76,
                duration: 0.16,
                ease: "power2.inOut",
              },
              0.38,
            )
            .to(shoeGlow, { autoAlpha: 0.5, scale: 1, duration: 0.12, ease: "power2.out" }, 0.4)

            // 3. The shoe first appears inside the box, masked by the front wall.
            .to(
              shoe,
              {
                autoAlpha: 0.96,
                yPercent: 28,
                scale: 0.74,
                rotation: -2,
                z: 54,
                duration: 0.12,
                ease: "power2.out",
              },
              0.42,
            )
            .to(
              shoe,
              {
                yPercent: -4,
                scale: 0.9,
                rotation: -1,
                z: 90,
                duration: 0.16,
                ease: "power2.inOut",
              },
              0.52,
            )

            // 4. The shoe clears the box and moves into a restrained hero pose.
            .to(
              shoe,
              {
                yPercent: -38,
                scale: 1.12,
                rotation: 3,
                z: 150,
                duration: 0.17,
                ease: "power2.inOut",
              },
              0.66,
            )
            .to(
              boxWrap,
              {
                yPercent: 20,
                scale: 0.91,
                autoAlpha: 0.68,
                duration: 0.16,
                ease: "power2.in",
              },
              0.75,
            )
            .to(floorShadow, { autoAlpha: 0.18, scaleX: 0.78, duration: 0.16 }, 0.75)
            .to(
              shoe,
              {
                yPercent: -72,
                scale: 1.32,
                rotation: -2,
                z: 210,
                duration: 0.16,
                ease: "power2.inOut",
              },
              0.78,
            )
            .to(shoeGlow, { autoAlpha: 0.22, scale: 1.35, duration: 0.14, ease: "sine.inOut" }, 0.8)

            // 5. Everything exits before the pin releases, so the next section never overlaps.
            .to([boxWrap, shoeGlow], { autoAlpha: 0, duration: 0.1, ease: "power1.in" }, 0.91)
            .to(
              shoe,
              {
                yPercent: -98,
                scale: 1.48,
                autoAlpha: 0,
                duration: 0.09,
                ease: "power2.in",
              },
              0.91,
            );
        }
      }, root);
    };

    void setupAnimations();

    return () => {
      cancelled = true;
      revealObserver?.disconnect();
      revealAnimations.forEach((animation) => animation.cancel());
      animationContext?.revert();
    };
  }, []);

  const recentOrderQuery = useQuery({
    queryKey: ["home-recent-order", lastOrder?.orderNumber, lastOrder?.phone],
    queryFn: () => trackOrder(lastOrder?.orderNumber || "", lastOrder?.phone || ""),
    enabled: !!lastOrder,
  });

  const orderDetails = recentOrderQuery.data?.order;

  return (
    <Layout>
      <div ref={pageRef} className="overflow-x-clip bg-background">
        {/* Recent Order Tracking Card */}
        {orderDetails && (
          <div className="relative z-30 mx-auto max-w-7xl px-4 pt-5 sm:pt-6">
            <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm transition duration-500 hover:shadow-md sm:flex-row sm:items-center sm:p-6">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-foreground">
                  {t("recentOrdersCardTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("recentOrdersCardSubtitle")}</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      {t("recentOrderNumberLabel")}:
                    </span>{" "}
                    <span className="font-extrabold text-foreground">
                      #{orderDetails.orderNumber}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">
                      {t("recentStatusLabel")}:
                    </span>{" "}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {orderDetails.orderStatus === "pending"
                        ? t("statusWaitingConfirm")
                        : orderDetails.orderStatus === "confirmed"
                          ? t("statusConfirmed")
                          : orderDetails.orderStatus === "preparing" ||
                              orderDetails.orderStatus === "processing"
                            ? t("statusPrepared")
                            : orderDetails.orderStatus === "shipped"
                              ? t("statusShipped")
                              : orderDetails.orderStatus === "out_for_delivery"
                                ? t("statusOutForDelivery")
                                : orderDetails.orderStatus === "delivered"
                                  ? t("statusDelivered")
                                  : orderDetails.orderStatus === "cancelled"
                                    ? t("statusCancelled")
                                    : orderDetails.orderStatus}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                to="/track-order"
                search={{ orderNumber: orderDetails.orderNumber, phone: lastOrder?.phone }}
                className="w-full shrink-0 rounded-xl bg-primary px-5 py-3 text-center text-sm font-bold text-primary-foreground shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md sm:w-auto"
              >
                {t("recentOrdersTrackBtn")}
              </Link>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="relative isolate bg-secondary/40">
          <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden bg-[radial-gradient(circle_at_16%_20%,hsl(var(--primary)/0.07),transparent_34%),radial-gradient(circle_at_86%_76%,hsl(var(--accent)/0.09),transparent_36%)]" />

          <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-10 pt-8 sm:pb-14 sm:pt-12 lg:min-h-[760px] lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-16 xl:min-h-[820px]">
            <div data-hero-copy className="order-2 relative z-20 lg:order-1 lg:col-span-5 lg:pr-4">
              <div
                data-hero-eyebrow
                className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-background/90 shadow-sm"
                aria-hidden="true"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              </div>

              <h1
                data-hero-title
                className="max-w-2xl text-5xl font-extrabold leading-[0.9] tracking-[-0.055em] text-foreground sm:text-6xl md:text-7xl lg:text-[5.4rem] xl:text-[6.4rem]"
              >
                {t("heroTitle")}
              </h1>

              <p
                data-hero-secondary
                className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {t("heroSubtitle")}
                <br />
                <span className="font-semibold text-foreground">{t("heroPay")}</span>
              </p>

              <div data-hero-secondary className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="inline-flex min-h-14 items-center justify-center rounded-xl bg-primary px-7 py-4 text-base font-bold text-primary-foreground shadow-md transition duration-300 hover:-translate-y-1 hover:bg-primary/90 hover:shadow-xl"
                >
                  {t("shopShoes")}
                </Link>
                <Link
                  to="/sale"
                  className="inline-flex min-h-14 items-center justify-center rounded-xl border border-primary bg-background px-7 py-4 text-base font-bold text-primary shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-secondary hover:shadow-lg"
                >
                  {t("viewSale")}
                </Link>
              </div>
            </div>

            <div className="order-1 relative lg:order-2 lg:col-span-7 lg:h-[660px] xl:h-[720px]">
              <div className="pointer-events-none absolute left-[8%] top-[8%] hidden h-[82%] w-[82%] rounded-full border border-primary/15 lg:block" />
              <div className="pointer-events-none absolute left-[16%] top-[16%] hidden h-[66%] w-[66%] rounded-full border border-primary/10 lg:block" />

              <div
                data-hero-visual
                className="relative h-full min-h-[480px] overflow-hidden rounded-[2rem] bg-card shadow-xl sm:min-h-[580px] lg:absolute lg:inset-0"
              >
                <img
                  src="/logo1.png"
                  width={1600}
                  height={1200}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  alt="ZORO"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/5" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[36px] border-white/10" />
                <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[30px] border-white/10" />
              </div>

              <div
                data-hero-detail
                className="absolute -bottom-5 left-3 hidden w-[34%] overflow-hidden rounded-2xl border-4 border-background bg-background shadow-xl sm:block lg:-left-8 lg:bottom-10"
              >
                <div className="group aspect-[4/5] overflow-hidden bg-secondary">
                  <img
                    src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=640&q=82"
                    width={640}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
              </div>

              <div
                data-hero-detail
                className="absolute right-3 top-3 hidden w-[29%] overflow-hidden rounded-2xl border-4 border-background bg-background shadow-xl sm:block lg:-right-5 lg:top-10"
              >
                <div className="group aspect-square overflow-hidden bg-secondary">
                  <img
                    src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=640&q=82"
                    width={640}
                    height={640}
                    loading="lazy"
                    decoding="async"
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-8 sm:pb-10 lg:-mt-3 lg:pb-12">
            <div className="grid overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-lg sm:grid-cols-3">
              <TrustPoint icon={<Truck className="h-5 w-5" />} label={t("deliveryAcrossPak")} />
              <TrustPoint icon={<Wallet className="h-5 w-5" />} label={t("cashOnDelivery")} />
              <TrustPoint icon={<RefreshCw className="h-5 w-5" />} label={t("easySizeExchange")} />
            </div>
          </div>
        </section>

        {/* Signature scroll interaction — shoe unboxing */}
        <ShoeBoxScrollScene />

        {/* Shop by Category — Men & Women only */}
        <section
          data-section
          className="relative z-0 mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24 [content-visibility:auto] [contain-intrinsic-size:1000px]"
        >
          <SectionTitle
            title={t("shopByCategory")}
            subtitle={t("shopByCategorySub")}
            align="left"
          />

          <div data-category-grid data-reveal-group className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            {HOME_CATEGORIES.map((c, index) => (
              <Link
                data-category-card
                key={c.to}
                to={c.to}
                className={`group relative overflow-hidden rounded-[1.75rem] bg-secondary shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                  index === 1 ? "lg:mt-14" : ""
                }`}
              >
                <div className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] xl:aspect-[5/4]">
                  <img
                    src={c.img}
                    srcSet={c.srcSet}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    width={1200}
                    height={1500}
                    loading="lazy"
                    decoding="async"
                    alt={t(c.titleKey)}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <div className="text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                        {t(c.titleKey)}
                      </div>
                      <div className="mt-3 inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white transition duration-300 group-hover:bg-background group-hover:text-foreground">
                        {t("shopNowArrow")}
                      </div>
                    </div>
                    <div className="hidden h-20 w-20 shrink-0 rounded-full border border-white/25 transition duration-500 group-hover:scale-110 group-hover:bg-white/10 sm:block" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        <section
          data-section
          data-product-reveal
          className="relative border-y border-border/60 bg-secondary/35 py-16 sm:py-20 lg:py-24 [content-visibility:auto] [contain-intrinsic-size:900px]"
        >
          <div className="mx-auto max-w-7xl px-4">
            <SectionTitle title={t("bestSellers")} subtitle={t("bestSellersSub")} align="left" />

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="mt-4 h-5 w-4/5" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="mt-4 h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
                <p className="font-semibold">{t("couldNotLoadShoes")}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  {t("tryAgain")}
                </button>
              </div>
            ) : bestSellers.length > 0 ? (
              <div
                data-product-grid
                className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4"
              >
                {bestSellers.map((p) => (
                  <div
                    key={p.id}
                    className="group min-w-0 transition duration-500 ease-out hover:-translate-y-1"
                  >
                    <div className="h-0.5 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
                    <div className="pt-2">
                      <ProductCard product={p} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm sm:p-12">
                {t("noShoesFound")}
              </div>
            )}
          </div>
        </section>

        {/* How to Order */}
        <section
          data-section
          className="mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24 [content-visibility:auto] [contain-intrinsic-size:900px]"
        >
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-5">
              <SectionTitle title={t("howToOrder")} subtitle={t("howToOrderSub")} align="left" />

              <div
                data-step-list
                data-reveal-group
                className="divide-y divide-border/80 border-y border-border/80"
              >
                <Step n={1} title={t("step1Title")} text={t("step1Text")} />
                <Step n={2} title={t("step2Title")} text={t("step2Text")} />
                <Step n={3} title={t("step3Title")} text={t("step3Text")} />
              </div>
            </div>

            <div className="relative min-h-[460px] lg:col-span-7 lg:min-h-[620px]">
              <div className="absolute inset-y-0 right-0 w-[82%] overflow-hidden rounded-[2rem] bg-secondary shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1200&q=82"
                  srcSet="https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=640&q=80 640w, https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=960&q=82 960w, https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1200&q=82 1200w"
                  sizes="(min-width: 1024px) 58vw, 82vw"
                  width={1200}
                  height={1500}
                  loading="lazy"
                  decoding="async"
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-8 left-0 w-[44%] overflow-hidden rounded-2xl border-4 border-background bg-background shadow-xl sm:bottom-12">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=700&q=82"
                    width={700}
                    height={875}
                    loading="lazy"
                    decoding="async"
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                </div>
              </div>

              <div className="pointer-events-none absolute -right-6 top-10 h-28 w-28 rounded-full border border-primary/20" />
              <div className="pointer-events-none absolute -right-10 top-14 h-28 w-28 rounded-full border border-primary/10" />
            </div>
          </div>
        </section>

        {/* Why Trust Us */}
        <section
          data-section
          className="bg-secondary/35 py-16 sm:py-20 lg:py-24 [content-visibility:auto] [contain-intrinsic-size:700px]"
        >
          <div className="mx-auto max-w-7xl px-4">
            <SectionTitle title={t("whyTrustUs")} align="left" />

            <div
              data-trust-grid
              data-reveal-group
              className="grid border-y border-border/80 sm:grid-cols-2 lg:grid-cols-4"
            >
              <TrustCard
                icon={<ShieldCheck className="h-6 w-6" />}
                title={t("trustOriginalQuality")}
                text={t("trustOriginalQualityText")}
              />
              <TrustCard
                icon={<Wallet className="h-6 w-6" />}
                title={t("trustCOD")}
                text={t("trustCODText")}
              />
              <TrustCard
                icon={<RefreshCw className="h-6 w-6" />}
                title={t("trustExchange")}
                text={t("trustExchangeText")}
              />
              <TrustCard
                icon={<Headphones className="h-6 w-6" />}
                title={t("trustSupport")}
                text={t("trustSupportText")}
              />
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section
          data-section
          className="mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24 [content-visibility:auto] [contain-intrinsic-size:900px]"
        >
          <SectionTitle
            title={t("customerReviews")}
            subtitle={t("customerReviewsSub")}
            align="left"
          />

          <div
            data-review-grid
            data-reveal-group
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          >
            {reviews.map((r, i) => (
              <div
                data-review-card
                key={i}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl sm:p-7 ${
                  i === 0
                    ? "md:col-span-2 lg:col-span-1 lg:row-span-2 lg:flex lg:flex-col lg:justify-between"
                    : ""
                }`}
              >
                <div>
                  <div className="mb-4 flex">
                    {Array.from({ length: r.rating }).map((_, k) => (
                      <Star key={k} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p
                    className={`leading-relaxed text-foreground ${
                      i === 0
                        ? "text-base sm:text-lg lg:text-2xl lg:leading-relaxed"
                        : "text-sm sm:text-base"
                    }`}
                  >
                    {r.text}
                  </p>
                </div>
                <div className="mt-6 text-xs font-semibold text-muted-foreground">
                  — {r.name}, {r.city}
                </div>
                <div className="pointer-events-none absolute -bottom-14 -right-14 h-36 w-36 rounded-full border border-primary/10 transition-transform duration-700 group-hover:scale-125" />
              </div>
            ))}
          </div>
        </section>

        {/* WhatsApp Help */}
        <section className="relative isolate overflow-hidden bg-primary py-16 text-primary-foreground sm:py-20 lg:py-24 [content-visibility:auto] [contain-intrinsic-size:520px]">
          <img
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80"
            width={1400}
            height={900}
            loading="lazy"
            decoding="async"
            alt=""
            className="absolute inset-0 -z-30 h-full w-full object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 -z-20 bg-primary/[0.88]" />
          <div className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-gradient-to-l from-black/20 to-transparent" />
          <div className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full border-[40px] border-primary-foreground/5" />

          <div
            data-whatsapp-content
            data-reveal-group
            className="mx-auto max-w-3xl px-4 text-center"
          >
            <h2 className="text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
              {t("needHelpSize")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80 sm:text-lg">
              {t("needHelpSizeText")}
            </p>
            <a
              href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(t("waHelpMsg"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-7 py-4 text-base font-bold text-whatsapp-foreground shadow-lg transition duration-300 hover:-translate-y-1 hover:opacity-90 hover:shadow-xl"
            >
              <MessageCircle className="h-5 w-5" />
              {t("chatOnWhatsApp")}
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
}

const ShoeBoxScrollScene = memo(function ShoeBoxScrollScene() {
  return (
    <section
      data-unbox-section
      aria-hidden="true"
      className="relative isolate z-40 h-[100svh] min-h-[100svh] w-full overflow-hidden bg-foreground text-background"
    >
      <div
        data-unbox-stage
        className="absolute inset-0 h-[100svh] min-h-[100svh] w-full overflow-hidden bg-foreground"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,hsl(var(--primary)/0.18),transparent_31%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[44%] h-[min(72vw,720px)] w-[min(72vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/10 sm:h-[min(58vw,720px)] sm:w-[min(58vw,720px)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />

        <div className="pointer-events-none absolute right-5 top-1/2 z-50 hidden h-44 w-px -translate-y-1/2 bg-background/15 sm:block">
          <div
            data-unbox-progress
            className="absolute bottom-0 left-0 h-full w-px origin-bottom bg-primary"
          />
        </div>

        <div className="pointer-events-none absolute bottom-8 left-1/2 z-50 h-10 w-px -translate-x-1/2 bg-background/25 sm:bottom-10" />

        <div
          data-unbox-scene
          className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden px-2 sm:px-6 [transform-style:preserve-3d]"
        >
          <div
            data-box-wrap
            className="relative h-[clamp(300px,52svh,470px)] w-[min(94vw,880px)] [transform-style:preserve-3d]"
          >
            <div
              data-floor-shadow
              className="absolute bottom-[1%] left-1/2 h-[10%] w-[68%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-lg"
            />

            <div
              data-shoe-glow
              className="absolute left-1/2 top-[26%] h-[54%] w-[58%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.34),transparent_68%)] opacity-0 motion-reduce:opacity-40"
            />

            {/* Box interior — behind the shoe. */}
            <div className="absolute bottom-[9%] left-1/2 z-20 h-[46%] w-[82%] -translate-x-1/2 [transform-style:preserve-3d] sm:w-[74%]">
              <div className="absolute inset-x-[2%] top-0 h-[64%] overflow-hidden rounded-t-[1rem] border border-background/15 bg-background/95 shadow-[inset_0_18px_28px_rgba(0,0,0,0.14)] sm:rounded-t-[1.35rem]">
                <div className="absolute inset-x-[7%] top-[23%] h-px bg-foreground/10" />
                <div className="absolute inset-x-[11%] top-[45%] h-px bg-foreground/5" />
                <div className="absolute inset-x-[5%] bottom-[4%] h-[40%] rounded-[50%] bg-black/5" />
              </div>
              <div className="absolute inset-x-[4%] bottom-[7%] h-[20%] rounded-[50%] bg-black/10" />
            </div>

            {/* Shoe — starts inside the box and is masked by the separate front wall below. */}
            <div
              data-unbox-shoe
              className="pointer-events-none absolute left-1/2 top-[29%] z-30 w-[86%] max-w-[760px] select-none opacity-0 sm:w-[72%] motion-reduce:opacity-100 motion-reduce:[transform:translateX(-50%)_translateY(-36%)_scale(0.95)_rotate(-2deg)]"
            >
              <div className="absolute bottom-[5%] left-1/2 h-[12%] w-[68%] -translate-x-1/2 rounded-[50%] bg-black/35 blur-md" />
              <img
                src={unboxingShoeImage}
                alt=""
                width={1240}
                height={860}
                loading="eager"
                fetchPriority="low"
                decoding="async"
                draggable={false}
                className="relative h-auto w-full object-contain"
              />
            </div>

            {/* Front wall — a sibling above the shoe so it genuinely masks the lower sole. */}
            <div className="absolute bottom-[9%] left-1/2 z-40 h-[23%] w-[82%] -translate-x-1/2 [transform-style:preserve-3d] sm:w-[74%]">
              <div className="absolute inset-0 overflow-hidden rounded-b-[1rem] border border-primary-foreground/10 bg-primary shadow-[0_20px_44px_rgba(0,0,0,0.34)] sm:rounded-b-[1.35rem]">
                <div className="absolute inset-x-0 top-0 h-px bg-primary-foreground/35" />
                <div className="absolute inset-[6%] rounded-[0.7rem] border border-primary-foreground/10" />
                <div className="absolute left-[8%] top-[32%] h-px w-[22%] bg-primary-foreground/20" />
                <div className="absolute right-[8%] top-[32%] h-px w-[22%] bg-primary-foreground/20" />
                <div className="absolute bottom-[18%] left-1/2 h-1 w-[18%] -translate-x-1/2 rounded-full bg-foreground/25" />
              </div>
              <div className="absolute -left-[4%] bottom-[4%] h-[90%] w-[5%] origin-right rounded-l-md bg-primary/80 [transform:skewY(18deg)]" />
              <div className="absolute -right-[4%] bottom-[4%] h-[90%] w-[5%] origin-left rounded-r-md bg-primary/80 [transform:skewY(-18deg)]" />
            </div>

            {/* Lid — opens from its rear edge rather than flying upward. */}
            <div
              data-box-lid
              className="absolute left-1/2 top-[15%] z-50 h-[31%] w-[84%] [backface-visibility:hidden] [transform-style:preserve-3d] sm:w-[76%] motion-reduce:[transform:translateX(-50%)_translateY(-10%)_rotateX(-104deg)]"
            >
              <div className="absolute inset-0 overflow-hidden rounded-[1rem] border border-primary-foreground/15 bg-primary shadow-[0_22px_44px_rgba(0,0,0,0.34)] sm:rounded-[1.35rem]">
                <div className="absolute inset-[5%] rounded-[0.75rem] border border-primary-foreground/15" />
                <div className="absolute inset-x-[9%] top-[20%] h-px bg-primary-foreground/20" />
                <div className="absolute inset-x-[9%] bottom-[20%] h-px bg-foreground/10" />
                <div className="absolute inset-x-0 bottom-0 h-[10%] bg-foreground/10" />
              </div>
              <div className="absolute inset-x-[2%] -bottom-[11%] h-[13%] rounded-b-md bg-primary/80 [transform:rotateX(-72deg)] [transform-origin:50%_0%]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

function SectionTitle({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      data-section-title
      data-reveal-group
      className={`mb-8 sm:mb-10 lg:mb-12 ${
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"
      }`}
    >
      <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function TrustPoint({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-4 text-sm font-semibold text-foreground transition duration-300 hover:bg-secondary/70 sm:justify-center sm:border-l sm:first:border-l-0">
      <span className="shrink-0 text-primary">{icon}</span>
      {label}
    </div>
  );
}

function TrustCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div
      data-trust-card
      className="group relative p-6 transition duration-500 hover:bg-background sm:border-l sm:first:border-l-0 lg:p-8"
    >
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition duration-500 group-hover:-translate-y-1 group-hover:scale-110">
        {icon}
      </div>
      <div className="text-lg font-bold text-foreground">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</div>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div data-step-card className="group grid grid-cols-[auto_1fr] gap-5 py-6 sm:gap-7 sm:py-8">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-accent-foreground shadow-sm transition duration-500 group-hover:-translate-y-1 group-hover:scale-110 sm:h-14 sm:w-14 sm:text-xl">
        {n}
      </div>
      <div className="min-w-0 pt-0.5">
        <div className="text-lg font-bold text-foreground sm:text-xl">{title}</div>
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}
