import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";
import { validateShopSearch } from "@/lib/shop-search";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/women")({
  validateSearch: validateShopSearch,
  head: () => ({ meta: [{ title: "Shop Women - ZORO" }] }),
  component: WomenPage,
});

function WomenPage() {
  const { t } = useLanguage();
  return (
    <ShopView
      initialCategory="Women"
      title="The women’s edit."
      subtitle="Clothing, footwear, fragrances and your everyday finishing touches."
    />
  );
}
