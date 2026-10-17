import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";
import { useLanguage } from "@/lib/language-context";
import { validateShopSearch } from "@/lib/shop-search";

export const Route = createFileRoute("/men")({
  validateSearch: validateShopSearch,
  head: () => ({ meta: [{ title: "Shop Men - ZORO" }] }),
  component: MenPage,
});

function MenPage() {
  const { t } = useLanguage();
  return (
    <ShopView
      initialCategory="Men"
      title="The men’s edit."
      subtitle="Clothing, footwear, fragrances and the finishing touches."
    />
  );
}
