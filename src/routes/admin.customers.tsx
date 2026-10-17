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
type RegisteredCustomer = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
};

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers - ZORO Admin" }] }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const customers = useQuery({
    queryKey: ["admin-customers"],
    queryFn: () =>
      adminApi.dashboard<{
        success: true;
        customers: CustomerRow[];
        accounts: RegisteredCustomer[];
      }>("customers"),
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
      <AdminCard>
        <h2 className="mb-4 text-lg font-bold">Registered accounts</h2>
        {customers.isLoading ? (
          <p>Loading accounts…</p>
        ) : customers.isError ? (
          <button className="text-link" onClick={() => customers.refetch()}>
            Retry loading customers
          </button>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr>
                  <th className="py-3">Name</th>
                  <th>Email</th>
                  <th>Orders</th>
                  <th>Total spent</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(customers.data?.accounts || []).map((account) => (
                  <tr key={account._id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold">{account.name}</td>
                    <td>{account.email}</td>
                    <td>{account.totalOrders}</td>
                    <td>{formatPKR(account.totalSpent)}</td>
                    <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!customers.data?.accounts?.length && (
              <p className="py-5 text-sm text-muted-foreground">No customer accounts yet.</p>
            )}
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
