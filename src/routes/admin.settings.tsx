import { createFileRoute } from "@tanstack/react-router";
import { AdminCard, AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings - ZORO Admin" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <AdminLayout title="Settings">
      <AdminCard>
        <div className="text-lg font-black">Environment Settings</div>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Backend configuration is controlled through environment variables: MongoDB URI, Cloudinary
          keys, frontend URL, JWT secret, delivery fee, free delivery threshold, and low-stock
          threshold.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            "MONGODB_URI",
            "CLOUDINARY_CLOUD_NAME",
            "CLOUDINARY_API_KEY",
            "FRONTEND_URL",
            "DELIVERY_FEE",
            "LOW_STOCK_THRESHOLD",
          ].map((key) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-black uppercase text-slate-500">{key}</div>
              <div className="mt-1 text-sm font-semibold text-slate-700">
                Configured on the backend server
              </div>
            </div>
          ))}
        </div>
      </AdminCard>
    </AdminLayout>
  );
}
