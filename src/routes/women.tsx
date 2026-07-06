import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/ShopView";

export const Route = createFileRoute("/women")({
  head: () => ({ meta: [{ title: "Women's Shoes - StepStyle Pakistan" }] }),
  component: () => <ShopView initialCategory="Women" title="Women's Shoes" subtitle="Stylish and comfortable" />,
});
