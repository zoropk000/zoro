import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { z } from "zod";
import { OrderSuccessView } from "@/components/OrderSuccessView";

const searchSchema = z.object({ order: z.string().optional() });

export const Route = createFileRoute("/order-success")({
  head: () => ({ meta: [{ title: "Order Placed - ZORO" }] }),
  validateSearch: searchSchema,
  component: SuccessPage,
});

function SuccessPage() {
  const location = useLocation();
  if (location.pathname !== "/order-success") return <Outlet />;
  return <OrderSuccessIndex />;
}

function OrderSuccessIndex() {
  const { order } = Route.useSearch();
  return <OrderSuccessView orderNumber={order} />;
}
