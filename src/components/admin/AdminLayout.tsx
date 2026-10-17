import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Settings,
  Users,
  X,
} from "lucide-react";
import { adminApi } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Products", to: "/admin/products", icon: Boxes },
  { label: "Add Product", to: "/admin/products/new", icon: PlusCircle },
  { label: "Orders", to: "/admin/orders", icon: Package },
  { label: "Customers", to: "/admin/customers", icon: Users },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Storefront", to: "/admin/storefront", icon: Boxes },
  { label: "Settings", to: "/admin/settings", icon: Settings },
] as const;

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-me"],
    queryFn: adminApi.me,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="rounded-2xl bg-white px-6 py-4 font-semibold shadow-sm">
          Loading admin...
        </div>
      </div>
    );
  }

  if (isError) {
    navigate({ to: "/admin/login" });
    return null;
  }

  const logout = async () => {
    await adminApi.logout().catch(() => null);
    toast.success("Logged out");
    navigate({ to: "/admin/login" });
  };

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-20 items-center justify-between px-5">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
            Z
          </div>
          <div>
            <div className="text-lg font-black text-slate-950">ZORO Admin</div>
            <div className="text-xs font-medium text-slate-500">Pakistan commerce</div>
          </div>
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-2 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active =
            item.to === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                active
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 rounded-xl bg-slate-50 p-3">
          <div className="text-sm font-bold text-slate-950">{data?.admin.name}</div>
          <div className="truncate text-xs text-slate-500">{data?.admin.email}</div>
        </div>
        <Button onClick={logout} variant="outline" className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      )}
      <main className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <ChevronLeft className="h-3 w-3" />
                Control room
              </div>
              <h1 className="text-2xl font-black tracking-normal text-slate-950">{title}</h1>
            </div>
          </div>
        </header>
        <div className="px-4 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    draft: "bg-slate-100 text-slate-700",
    "out-of-stock": "bg-rose-50 text-rose-700",
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-indigo-50 text-indigo-700",
    shipped: "bg-cyan-50 text-cyan-700",
    delivered: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-rose-50 text-rose-700",
    paid: "bg-emerald-50 text-emerald-700",
    failed: "bg-rose-50 text-rose-700",
    "verification-needed": "bg-purple-50 text-purple-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black capitalize ${styles[value] || "bg-slate-100 text-slate-700"}`}
    >
      {value.replace(/-/g, " ")}
    </span>
  );
}
