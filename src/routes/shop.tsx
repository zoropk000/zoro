import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";
import { validateShopSearch } from "@/lib/shop-search";

export const Route = createFileRoute("/shop")({
  validateSearch: validateShopSearch,
  head: () => ({ meta: [{ title: "Shop Clothing, Shoes, Perfumes & Accessories - ZORO" }] }),
  component: () => <ShopView />,
});
