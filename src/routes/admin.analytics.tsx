import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminCard, AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/services/adminService";
import { formatPKR } from "@/lib/currency";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics - ZORO Admin" }] }),
  component: AdminAnalytics,
});

const colors = ["#0f172a", "#2563eb", "#10b981", "#f59e0b", "#e11d48", "#7c3aed"];
type ChartSlice = { name: string; value: number };
type TimePoint = { label: string; revenue?: number; orders?: number };
type GenderPoint = { name: string; units: number; revenue: number };

function AdminAnalytics() {
  const revenue = useQuery({
    queryKey: ["analytics-revenue"],
    queryFn: () =>
      adminApi.dashboard<{ success: true; data: TimePoint[] }>("revenue?range=monthly"),
  });
  const orders = useQuery({
    queryKey: ["analytics-orders"],
    queryFn: () => adminApi.dashboard<{ success: true; data: TimePoint[] }>("orders?range=monthly"),
  });
  const payment = useQuery({
    queryKey: ["analytics-payment"],
    queryFn: () => adminApi.dashboard<{ success: true; data: ChartSlice[] }>("payment-methods"),
  });
  const status = useQuery({
    queryKey: ["analytics-status"],
    queryFn: () => adminApi.dashboard<{ success: true; data: ChartSlice[] }>("order-statuses"),
  });
  const gender = useQuery({
    queryKey: ["analytics-gender"],
    queryFn: () => adminApi.dashboard<{ success: true; data: GenderPoint[] }>("gender-sales"),
  });

  return (
    <AdminLayout title="Analytics">
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue Chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenue.data?.data || []}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => formatPKR(Number(value))} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0f172a"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Orders Chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={orders.data?.data || []}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Payment Method Chart">
          <Donut data={payment.data?.data || []} />
        </ChartCard>
        <ChartCard title="Order Status Chart">
          <Donut data={status.data?.data || []} />
        </ChartCard>
        <ChartCard title="Men vs Women Product Sales">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gender.data?.data || []}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="units" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </AdminLayout>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AdminCard>
      <div className="mb-4 text-lg font-black">{title}</div>
      <div className="h-80">{children}</div>
    </AdminCard>
  );
}

function Donut({ data }: { data: ChartSlice[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={4}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
