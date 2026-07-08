import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/women")({
  head: () => ({ meta: [{ title: "Women's Shoes - ZORO" }] }),
  component: WomenPage,
});

function WomenPage() {
  const { t } = useLanguage();
  return <ShopView initialCategory="Women" title={t("womenPageTitle")} subtitle={t("womenPageSub")} />;
}
