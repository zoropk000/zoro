import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Boxes, PackageCheck, ShoppingBag, TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminCard, AdminLayout, StatusBadge } from "@/components/admin/AdminLayout";
import { adminApi } from "@/services/adminService";
import { formatPKR } from "@/lib/currency";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard - ZORO" }] }),
  component: AdminDashboard,
});

const colors = ["#0f172a", "#2563eb", "#10b981", "#f59e0b", "#e11d48"];
type DashboardSummary = {
  success: true;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    lowStockProducts: number;
    pendingOrders: number;
    totalCustomers: number;
  };
  recentOrders: {
    _id: string;
    orderNumber: string;
    customer: { name: string; phone: string };
    total: number;
    orderStatus: string;
    createdAt: string;
  }[];
};
type RevenueResponse = { success: true; data: { label: string; revenue: number }[] };
type PaymentResponse = { success: true; data: { name: string; value: number }[] };
type TopProductsResponse = {
  success: true;
  products: {
    _id: string;
    name: string;
    image: string;
    unitsSold: number;
    revenue: number;
    remainingStock: number;
  }[];
};

function AdminDashboard() {
  const location = useLocation();
  return location.pathname !== "/admin" ? <Outlet /> : <AdminDashboardIndex />;
}

function AdminDashboardIndex() {
  const summary = useQuery({
    queryKey: ["admin-summary"],
    queryFn: () => adminApi.dashboard<DashboardSummary>("summary"),
  });
  const revenue = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => adminApi.dashboard<RevenueResponse>("revenue?range=monthly"),
  });
  const payment = useQuery({
    queryKey: ["admin-payment"],
    queryFn: () => adminApi.dashboard<PaymentResponse>("payment-methods"),
  });
  const topProducts = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: () => adminApi.dashboard<TopProductsResponse>("top-products"),
  });

  const cards = [
    {
      label: "Total Revenue",
      value: formatPKR(summary.data?.summary.totalRevenue || 0),
      icon: TrendingUp,
    },
    { label: "Total Orders", value: summary.data?.summary.totalOrders || 0, icon: ShoppingBag },
    { label: "Total Products", value: summary.data?.summary.totalProducts || 0, icon: Boxes },
    {
      label: "Low Stock Products",
      value: summary.data?.summary.lowStockProducts || 0,
      icon: PackageCheck,
    },
    { label: "Pending Orders", value: summary.data?.summary.pendingOrders || 0, icon: BarChart3 },
    { label: "Total Customers", value: summary.data?.summary.totalCustomers || 0, icon: Users },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <AdminCard key={card.label}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-500">{card.label}</div>
                  <div className="mt-2 text-3xl font-black">{card.value}</div>
                </div>
                <div className="rounded-2xl bg-slate-950 p-3 text-white">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </AdminCard>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <AdminCard>
          <div className="mb-4 text-lg font-black">Revenue Chart</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue.data?.data || []}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatPKR(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0f172a"
                  fill="#0f172a"
                  fillOpacity={0.16}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
        <AdminCard>
          <div className="mb-4 text-lg font-black">Payment Methods</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={payment.data?.data || []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                >
                  {(payment.data?.data || []).map((_, index: number) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-black">Recent Orders</div>
            <Link to="/admin/orders" className="text-sm font-bold text-slate-600">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(summary.data?.recentOrders || []).map((order) => (
                  <tr key={order._id} className="border-t border-slate-100">
                    <td className="py-3 font-bold">{order.orderNumber}</td>
                    <td>
                      {order.customer.name}
                      <div className="text-xs text-slate-500">{order.customer.phone}</div>
                    </td>
                    <td>{formatPKR(order.total)}</td>
                    <td>
                      <StatusBadge value={order.orderStatus} />
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
        <AdminCard>
          <div className="mb-4 text-lg font-black">Top Products</div>
          <div className="space-y-3">
            {(topProducts.data?.products || []).map((product) => (
              <div
                key={product._id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
              >
                <img
                  src={product.image || "/logo.png"}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{product.name}</div>
                  <div className="text-xs text-slate-500">
                    {product.unitsSold} sold - {formatPKR(product.revenue)}
                  </div>
                </div>
                <div className="text-right text-xs font-bold text-slate-500">
                  Stock
                  <br />
                  {product.remainingStock}
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
