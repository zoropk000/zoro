import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";
import { validateShopSearch } from "@/lib/shop-search";

export const Route = createFileRoute("/sale")({
  validateSearch: validateShopSearch,
  head: () => ({ meta: [{ title: "Sale - ZORO" }] }),
  component: () => (
    <ShopView
      saleOnly
      title="The sale edit."
      subtitle="Everyday favourites, with a little more to love about the price."
    />
  ),
});
