import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminCard, AdminLayout, StatusBadge } from "@/components/admin/AdminLayout";
import { adminApi, type AdminOrder } from "@/services/adminService";
import { formatPKR } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order Details - ZORO Admin" }] }),
  component: AdminOrderDetails,
});

type OrderItem = AdminOrder["items"][number];
type TrackingEvent = NonNullable<AdminOrder["trackingEvents"]>[number];

function addWorkingDays(startDate: Date, days: number) {
  const date = new Date(startDate);
  let remainingDays = days;
  while (remainingDays > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      remainingDays--;
    }
  }
  return date;
}

function AdminOrderDetails() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const order = useQuery({ queryKey: ["admin-order", id], queryFn: () => adminApi.order(id) });
  const data = order.data?.order;

  // Form states
  const [minDays, setMinDays] = useState("3");
  const [maxDays, setMaxDays] = useState("5");
  const [showEditEstimate, setShowEditEstimate] = useState(false);
  const [savingEstimate, setSavingEstimate] = useState(false);
  const [resendingType, setResendingType] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);

  const updateStatus = async (status: string) => {
    try {
      await adminApi.updateOrderStatus(id, status);
      toast.success("Order status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update order.");
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = Number(minDays);
    const maxVal = Number(maxDays);

    if (isNaN(minVal) || isNaN(maxVal) || minVal <= 0 || maxVal <= 0) {
      toast.error("Please enter valid positive delivery day estimates.");
      return;
    }
    if (maxVal < minVal) {
      toast.error("Maximum days cannot be less than minimum days.");
      return;
    }

    try {
      setSavingEstimate(true);
      await adminApi.confirmOrder(id, minVal, maxVal);
      toast.success("Order confirmed and tracker started!");
      setShowEditEstimate(false);
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not confirm order.");
    } finally {
      setSavingEstimate(false);
    }
  };

  const handleResendEmail = async (emailType: string) => {
    try {
      setResendingType(emailType);
      await adminApi.resendEmail(id, emailType);
      toast.success(`Email type '${emailType}' sent successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend email.");
    } finally {
      setResendingType(null);
    }
  };

  // Preview calculations
  const minVal = Number(minDays);
  const maxVal = Number(maxDays);
  const isEstimateValid = minVal > 0 && maxVal > 0 && maxVal >= minVal;

  let previewText = "";
  let datePreview = "";
  if (isEstimateValid) {
    previewText = `${minVal}–${maxVal} Working Days`;
    const start = addWorkingDays(new Date(), minVal);
    const end = addWorkingDays(new Date(), maxVal);
    const format = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
    datePreview = `${format(start)} – ${format(end)}`;
  }

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
                {data.items.map((item: OrderItem, index: number) => (
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

            {/* Visual Tracking History for Admin */}
            <AdminCard>
              <div className="mb-4 text-lg font-black">Tracking Timeline History</div>
              {data.trackingEvents && data.trackingEvents.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
                  {data.trackingEvents.map((evt: TrackingEvent, idx: number) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[33px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 ring-4 ring-white" />
                      <div>
                        <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          {evt.title}{" "}
                          <span className="text-xs text-slate-400">({evt.titleUrdu})</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(evt.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No tracking timeline history events generated yet.
                </p>
              )}
            </AdminCard>
          </div>

          <div className="space-y-5">
            {/* Delivery Estimate section */}
            <AdminCard>
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-black">🚚 Delivery Estimate</div>
                {data.orderStatus !== "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowEditEstimate(!showEditEstimate)}
                  >
                    {showEditEstimate ? "Cancel" : "Edit"}
                  </Button>
                )}
              </div>

              {data.orderStatus === "pending" || showEditEstimate ? (
                <form onSubmit={handleConfirmOrder} className="space-y-4">
                  <p className="text-xs text-slate-500">
                    How many days will this order take to deliver?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500">Minimum Days</label>
                      <input
                        type="number"
                        min="1"
                        value={minDays}
                        onChange={(e) => setMinDays(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500">Maximum Days</label>
                      <input
                        type="number"
                        min="1"
                        value={maxDays}
                        onChange={(e) => setMaxDays(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"
                        required
                      />
                    </div>
                  </div>

                  {isEstimateValid && (
                    <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1">
                      <div>
                        <span className="font-bold text-slate-500">Preview:</span>{" "}
                        <span className="font-black text-slate-800">{previewText}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">Estimated Dates:</span>{" "}
                        <span className="font-black text-slate-800">{datePreview}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full font-bold cursor-pointer"
                    disabled={!isEstimateValid || savingEstimate}
                  >
                    {savingEstimate
                      ? "Processing..."
                      : data.orderStatus === "pending"
                        ? "✅ CONFIRM ORDER"
                        : "UPDATE ESTIMATE"}
                  </Button>
                </form>
              ) : data.deliveryEstimate && data.deliveryEstimate.minDays ? (
                <div className="space-y-3">
                  <Info
                    label="Estimate"
                    value={`${data.deliveryEstimate.minDays}–${data.deliveryEstimate.maxDays} Working Days`}
                  />
                  <Info
                    label="Expected Dates"
                    value={
                      data.deliveryEstimate.estimatedStartDate
                        ? `${new Date(data.deliveryEstimate.estimatedStartDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "long",
                            },
                          )} – ${new Date(
                            data.deliveryEstimate.estimatedEndDate,
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                          })}`
                        : "-"
                    }
                  />
                  {data.confirmedAt && (
                    <Info
                      label="Confirmed At"
                      value={new Date(data.confirmedAt).toLocaleString()}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Order is pending confirmation.</p>
              )}
            </AdminCard>

            <AdminCard>
              <div className="mb-4 text-lg font-black">Customer</div>
              <Info label="Name" value={data.customer.name} />
              <Info label="Phone" value={data.customer.phone} />
              <Info label="Email" value={data.customer.email || "-"} />
              <Info label="City" value={data.customer.city} />
              <Info label="Address" value={data.customer.address} />
              <Info label="Landmark" value={data.customer.landmark || "-"} />
            </AdminCard>

            {/* Email status checklist */}
            <AdminCard>
              <div className="mb-4 text-lg font-black">📧 Customer Emails</div>
              <div className="space-y-4">
                {[
                  { type: "orderReceived", label: "Order Received Email" },
                  { type: "orderConfirmed", label: "Order Confirmation Email" },
                  { type: "shipped", label: "Shipped Email" },
                  { type: "out_for_delivery", label: "Out for Delivery Email" },
                  { type: "delivered", label: "Delivered Email" },
                ].map(({ type, label }) => {
                  const email = data.emailStatus?.[type as keyof typeof data.emailStatus];
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3"
                    >
                      <div className="text-sm">
                        <div className="font-bold flex items-center gap-1.5">
                          {email?.sent ? (
                            <span className="text-emerald-600">✅ {label}</span>
                          ) : email?.error ? (
                            <span className="text-destructive">❌ {label} (Failed)</span>
                          ) : (
                            <span className="text-slate-400">⚪ {label}</span>
                          )}
                        </div>
                        {email?.sentAt && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {new Date(email.sentAt).toLocaleString()}
                          </div>
                        )}
                        {email?.error && (
                          <div className="text-xs text-destructive mt-0.5 max-w-[180px] break-words">
                            Error: {email.error}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResendEmail(type)}
                        disabled={resendingType === type}
                      >
                        {resendingType === type ? "..." : email?.sent ? "Resend" : "Send"}
                      </Button>
                    </div>
                  );
                })}
              </div>
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

              {/* Payment Proof Screenshot */}
              {data.paymentProof?.url ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="text-xs font-black uppercase text-slate-500 mb-2">
                    Payment Proof Screenshot
                  </div>
                  <div
                    className="cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    onClick={() => setProofOpen(true)}
                  >
                    <img
                      src={data.paymentProof.url}
                      alt="Payment proof"
                      className="w-full max-h-64 object-contain hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Uploaded: {new Date(data.paymentProof.uploadedAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    Click image to view full size
                  </p>
                  {data.paymentStatus !== "paid" && (
                    <Button
                      className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      onClick={async () => {
                        try {
                          await adminApi.updatePaymentStatus(id, "paid");
                          toast.success("Payment marked as verified ✅");
                          queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
                        } catch {
                          toast.error("Could not update payment status.");
                        }
                      }}
                    >
                      ✅ Mark Payment as Verified
                    </Button>
                  )}
                </div>
              ) : data.paymentMethod === "easypaisa_jazzcash" ||
                data.paymentMethod === "meezan_bank" ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="text-xs font-black uppercase text-slate-500 mb-1">
                    Payment Proof
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 font-semibold">
                    ⚠️ No screenshot uploaded yet by customer.
                  </div>
                </div>
              ) : null}
            </AdminCard>

            <AdminCard>
              <div className="mb-4 text-lg font-black">Order Actions</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "confirmed",
                  "preparing",
                  "shipped",
                  "out_for_delivery",
                  "delivered",
                  "cancelled",
                ].map((status) => (
                  <Button
                    key={status}
                    variant={status === "cancelled" ? "destructive" : "outline"}
                    onClick={() => updateStatus(status)}
                    disabled={
                      data.orderStatus === "pending" &&
                      status !== "confirmed" &&
                      status !== "cancelled"
                    }
                  >
                    {status === "preparing"
                      ? "preparing"
                      : status === "out_for_delivery"
                        ? "out for delivery"
                        : status}
                  </Button>
                ))}
              </div>
            </AdminCard>
          </div>
        </div>
      )}

      {/* ── Fullscreen Lightbox for Payment Proof ── */}
      {proofOpen && data?.paymentProof?.url && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setProofOpen(false)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setProofOpen(false)}
              className="absolute -top-10 right-0 text-white text-sm font-bold bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1"
            >
              ✕ Close
            </button>
            <img
              src={data.paymentProof.url}
              alt="Payment proof full size"
              className="w-full rounded-2xl object-contain max-h-[85vh] shadow-2xl"
            />
            <a
              href={data.paymentProof.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-xs text-white/60 hover:text-white underline"
            >
              Open original in new tab
            </a>
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
