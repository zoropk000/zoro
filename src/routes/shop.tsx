import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "All Shoes — StepStyle Pakistan" }] }),
  component: () => <ShopView />,
});
