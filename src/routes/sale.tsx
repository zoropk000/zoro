import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/sale")({
  head: () => ({ meta: [{ title: "Sale - StepStyle Pakistan" }] }),
  component: SalePage,
});

function SalePage() {
  const { t } = useLanguage();
  return (
    <ShopView
      saleOnly
      title={t("footerSale")}
      subtitle={t("allShoesSub")}
    />
  );
}
