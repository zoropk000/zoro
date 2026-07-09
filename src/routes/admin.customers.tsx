import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/services/adminService";
import { formatPKR } from "@/lib/currency";

type CustomerRow = {
  name: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
};

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers - ZORO Admin" }] }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const customers = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () => adminApi.dashboard<{ success: true; customers: CustomerRow[] }>("customers"),
  });

  return (
    <AdminLayout title="Customers">
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3">Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {(customers.data?.customers || []).map((customer) => (
                <tr key={customer.phone} className="border-t border-slate-100">
                  <td className="py-3 font-black">{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.city}</td>
                  <td>{customer.totalOrders}</td>
                  <td className="font-bold">{formatPKR(customer.totalSpent)}</td>
                  <td>{new Date(customer.lastOrder).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
