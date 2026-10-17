import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowUpRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useCustomer } from "@/lib/customer-context";
import { getProducts } from "@/services/productService";
export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Your Wishlist - ZORO" }] }),
  component: Wishlist,
});
function Wishlist() {
  const { wishlist, customer } = useCustomer();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["wishlist-products", wishlist],
    queryFn: () => getProducts({ ids: wishlist, limit: 100 }),
    enabled: wishlist.length > 0,
  });
  return (
    <Layout>
      <div className="catalog-header">
        <div className="store-container">
          <span className="small-eyebrow">KEEP A LITTLE SOMETHING FOR LATER</span>
          <h1>Your favourite finds.</h1>
          <p>
            {customer ? (
              "Saved to your account, ready when you are."
            ) : (
              <>
                Saved on this device.{" "}
                <Link to="/account" className="underline">
                  Sign in
                </Link>{" "}
                to keep them with you.
              </>
            )}
          </p>
        </div>
      </div>
      <div className="store-container home-section">
        {wishlist.length === 0 ? (
          <div className="collection-empty">
            <Heart size={30} strokeWidth={1} />
            <h3>Your wishlist is waiting.</h3>
            <p>Tap the heart on anything that catches your eye.</p>
            <Link to="/shop" className="text-link">
              Find a favourite <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : isLoading ? (
          <p className="py-12 text-center text-sm">Loading your favourites…</p>
        ) : isError ? (
          <div className="collection-empty">
            <p>We couldn’t load your wishlist.</p>
            <button className="text-link" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="store-product-grid">
              {data?.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {!data?.products.length && (
              <div className="collection-empty">
                <p>Your saved products are currently unavailable.</p>
                <Link to="/shop" className="text-link">
                  Explore current finds
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
