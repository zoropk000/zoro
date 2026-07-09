import { createFileRoute } from "@tanstack/react-router";
import { OrderSuccessView } from "@/components/OrderSuccessView";

export const Route = createFileRoute("/order-success/$orderNumber")({
  head: () => ({ meta: [{ title: "Order Placed - ZORO" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { orderNumber } = Route.useParams();
  return <OrderSuccessView orderNumber={orderNumber} />;
}
