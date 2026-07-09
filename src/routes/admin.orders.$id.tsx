import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminCard, AdminLayout, StatusBadge } from "@/components/admin/AdminLayout";
import { adminApi } from "@/services/adminService";
import { formatPKR } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order Details - ZORO Admin" }] }),
  component: AdminOrderDetails,
});

function AdminOrderDetails() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const order = useQuery({ queryKey: ["admin-order", id], queryFn: () => adminApi.order(id) });
  const data = order.data?.order;

  const updateStatus = async (status: string) => {
    try {
      await adminApi.updateOrderStatus(id, status);
      toast.success("Order status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update order.");
    }
  };

  return (
    <AdminLayout title="Order Details">
      {order.isLoading ? (
        <AdminCard>Loading order...</AdminCard>
      ) : !data ? (
        <AdminCard>Order not found.</AdminCard>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <AdminCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-500">Order Number</div>
                  <div className="text-2xl font-black">{data.orderNumber}</div>
                </div>
                <StatusBadge value={data.orderStatus} />
              </div>
            </AdminCard>
            <AdminCard>
              <div className="mb-4 text-lg font-black">Products</div>
              <div className="space-y-3">
                {data.items.map((item, index) => (
                  <div key={index} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                    <img
                      src={item.image || "/logo.png"}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-black">{item.name}</div>
                      <div className="text-sm text-slate-500">
                        Size {item.size} - Qty {item.quantity}
                      </div>
                    </div>
                    <div className="font-black">{formatPKR(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            </AdminCard>
          </div>
          <div className="space-y-5">
            <AdminCard>
              <div className="mb-4 text-lg font-black">Customer</div>
              <Info label="Name" value={data.customer.name} />
              <Info label="Phone" value={data.customer.phone} />
              <Info label="City" value={data.customer.city} />
              <Info label="Address" value={data.customer.address} />
              <Info label="Landmark" value={data.customer.landmark || "-"} />
            </AdminCard>
            <AdminCard>
              <div className="mb-4 text-lg font-black">Payment</div>
              <Info label="Method" value={data.paymentMethod.replace(/_/g, " ")} />
              <div className="mb-3">
                <StatusBadge value={data.paymentStatus} />
              </div>
              <Info label="Subtotal" value={formatPKR(data.subtotal)} />
              <Info label="Delivery" value={formatPKR(data.deliveryFee)} />
              <Info label="Total" value={formatPKR(data.total)} strong />
            </AdminCard>
            <AdminCard>
              <div className="mb-4 text-lg font-black">Order Actions</div>
              <div className="grid grid-cols-2 gap-2">
                {["confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                  <Button
                    key={status}
                    variant={status === "cancelled" ? "destructive" : "outline"}
                    onClick={() => updateStatus(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </AdminCard>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-black uppercase text-slate-500">{label}</div>
      <div className={strong ? "text-xl font-black" : "font-semibold"}>{value}</div>
    </div>
  );
}
