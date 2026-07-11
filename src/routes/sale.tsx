import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";

export const Route = createFileRoute("/sale")({
  head: () => ({ meta: [{ title: "Sale - ZORO" }] }),
  component: () => <ShopView saleOnly title="Sale" subtitle="Save on selected shoes" />,
});
