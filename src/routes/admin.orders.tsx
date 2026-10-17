import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Eye, Search } from "lucide-react";
import { AdminCard, AdminLayout, StatusBadge } from "@/components/admin/AdminLayout";
import { adminApi } from "@/services/adminService";
import { formatPKR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders - ZORO Admin" }] }),
  component: AdminOrders,
});

function AdminOrders() {
  const location = useLocation();
  return location.pathname !== "/admin/orders" ? <Outlet /> : <AdminOrdersIndex />;
}

function AdminOrdersIndex() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search, status, paymentMethod, paymentStatus]);
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (paymentMethod) params.set("paymentMethod", paymentMethod);
  if (paymentStatus) params.set("paymentStatus", paymentStatus);
  const query = params.toString() ? `?${params}` : "";
  const orders = useQuery({
    queryKey: ["admin-orders", query],
    queryFn: () => adminApi.orders(query),
  });

  return (
    <AdminLayout title="Orders">
      <AdminCard>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_210px_210px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, phone, customer..."
              className="pl-9"
            />
          </div>
          <Filter
            value={status}
            onChange={setStatus}
            options={[
              "pending",
              "confirmed",
              "preparing",
              "processing",
              "shipped",
              "out_for_delivery",
              "delivered",
              "cancelled",
            ]}
            label="Status"
          />
          <Filter
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={["cod", "easypaisa_jazzcash", "meezan_bank"]}
            label="Payment Method"
          />
          <Filter
            value={paymentStatus}
            onChange={setPaymentStatus}
            options={["pending", "paid", "verification-needed", "failed"]}
            label="Payment Status"
          />
        </div>
      </AdminCard>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.data?.orders.map((order) => (
                <tr key={order._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-black">{order.orderNumber}</td>
                  <td>{order.customer.name}</td>
                  <td>{order.customer.phone}</td>
                  <td className="font-bold">{formatPKR(order.total)}</td>
                  <td>
                    <StatusBadge value={order.paymentMethod} />
                    <div className="mt-1">
                      <StatusBadge value={order.paymentStatus} />
                    </div>
                    {order.paymentProof?.url && (
                      <span className="mt-1 block text-xs text-emerald-700">
                        Screenshot received
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge value={order.orderStatus} />
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="pr-4 text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: order._id }}
                        aria-label={`View order ${order.orderNumber}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {!orders.isLoading && orders.data?.orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {orders.isError && (
        <div className="collection-empty mt-5">
          <p>Could not load orders.</p>
          <button className="text-link" onClick={() => orders.refetch()}>
            Try again
          </button>
        </div>
      )}
      {orders.data && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            {orders.data.pagination.total} orders · Page {page} of {orders.data.pagination.pages}
          </span>
          <button disabled={page >= orders.data.pagination.pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

function Filter({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-md border border-input bg-background px-3"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option.replace(/_/g, " ").replace(/-/g, " ")}
        </option>
      ))}
    </select>
  );
}
