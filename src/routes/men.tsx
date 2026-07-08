import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/men")({
  head: () => ({ meta: [{ title: "Men's Shoes - ZORO" }] }),
  component: MenPage,
});

function MenPage() {
  const { t } = useLanguage();
  return <ShopView initialCategory="Men" title={t("menPageTitle")} subtitle={t("menPageSub")} />;
}
