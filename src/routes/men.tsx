import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";

export const Route = createFileRoute("/men")({
  head: () => ({ meta: [{ title: "Men's Shoes - StepStyle Pakistan" }] }),
  component: () => <ShopView initialCategory="Men" title="Men's Shoes" subtitle="Comfortable shoes for every day" />,
});
