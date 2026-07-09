import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useCart } from "@/lib/cart-context";
import { formatPKR } from "@/lib/currency";
import { calcDeliveryFee } from "@/lib/orders";
import { createOrder } from "@/services/orderService";
import { API_BASE_URL } from "@/services/api";
import { pakistaniCities } from "@/data/cities";
import { validatePakistaniPhone, normalizePhone } from "@/lib/validation";
import { Lock, Mail, Phone, ShieldCheck, Wallet, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout - ZORO" }] }),
  component: CheckoutPage,
});

type Errors = Partial<Record<"name" | "phone" | "email" | "city" | "cityOther" | "address", string>>;

function CheckoutPage() {
  const { lines, subtotal, clearCart, isLoading } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const delivery = calcDeliveryFee(subtotal);
  const total = subtotal + delivery;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [emailPopup, setEmailPopup] = useState<{ orderNumber: string; email: string } | null>(null);

  useEffect(() => {
    if (!isLoading && lines.length === 0) {
      navigate({ to: "/cart" });
    }
  }, [isLoading, lines.length, navigate]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = t("errName");
    if (!phone.trim()) e.phone = t("errPhone");
    else if (!validatePakistaniPhone(phone)) e.phone = t("errPhoneInvalid");
    
    if (!email.trim()) {
      e.email = t("errEmail");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = t("errEmail");
    }

    if (!city) e.city = t("errCity");
    if (city === "Other" && !cityOther.trim()) e.cityOther = t("errCityOther");
    if (!address.trim()) e.address = t("errAddress");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReviewClick = () => {
    if (validate()) setShowConfirm(true);
  };

  const placeOrder = async () => {
    try {
      setSubmitting(true);
      const response = await createOrder({
        customer: {
          name: name.trim(),
          phone: normalizePhone(phone),
          email: email.trim().toLowerCase(),
          city: city === "Other" ? cityOther.trim() : city,
          address: address.trim(),
          landmark: landmark.trim() || undefined,
        },
        items: lines.map((l) => ({
          productId: l.productId,
          size: l.size,
          quantity: l.quantity,
        })),
        paymentMethod: paymentMethod as "cod" | "easypaisa" | "meezan",
      });

      // Save recent order reference to LocalStorage
      try {
        const recentOrders = JSON.parse(localStorage.getItem("recentOrders") || "[]");
        recentOrders.push({
          orderNumber: response.order.orderNumber,
          phone: normalizePhone(phone),
        });
        localStorage.setItem("recentOrders", JSON.stringify(recentOrders));
      } catch (err) {
        console.error("Failed to write recentOrders to LocalStorage", err);
      }

      clearCart();
      setShowConfirm(false);

      // Upload payment proof screenshot if provided
      const createdOrderNumber = response.order.orderNumber;
      if (proofFile && (paymentMethod === "easypaisa" || paymentMethod === "meezan")) {
        try {
          const formData = new FormData();
          formData.append("proof", proofFile);
          await fetch(
            `${API_BASE_URL}/orders/${createdOrderNumber}/payment-proof`,
            { method: "POST", body: formData }
          );
        } catch (err) {
          console.warn("Payment proof upload failed:", err);
        }
      }

      // Show the email confirmation popup instead of immediately navigating
      setEmailPopup({
        orderNumber: createdOrderNumber,
        email: email.trim().toLowerCase(),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orderFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const finalCity = city === "Other" ? cityOther : city;
  const paymentDisplay =
    paymentMethod === "cod"
      ? t("paymentCodDisplay")
      : paymentMethod === "easypaisa"
        ? t("paymentEasypaisaDisplay")
        : t("paymentMeezanDisplay");

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold">{t("completeYourOrder")}</h1>
          <p className="mt-2 text-muted-foreground">{t("checkoutSubtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleReviewClick();
            }}
            className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <Field
              label={t("yourFullName")}
              value={name}
              onChange={setName}
              placeholder={t("namePlaceholder")}
              error={errors.name}
              autoComplete="name"
            />
            <Field
              label={t("mobileNumber")}
              value={phone}
              onChange={setPhone}
              placeholder={t("mobilePlaceholder")}
              error={errors.phone}
              helper={t("mobileHelper")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
            <Field
              label={t("emailAddressLabel")}
              value={email}
              onChange={setEmail}
              placeholder={t("emailAddressPlaceholder")}
              error={errors.email}
              type="email"
              inputMode="email"
              autoComplete="email"
            />
            <div>
              <label className="mb-1 block text-sm font-semibold">{t("city")}</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base"
              >
                <option value="">{t("selectYourCity")}</option>
                {pakistaniCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.city && <p className="mt-1 text-sm text-destructive">{errors.city}</p>}
              {city === "Other" && (
                <div className="mt-3">
                  <Field
                    label={t("enterCityName")}
                    value={cityOther}
                    onChange={setCityOther}
                    placeholder={t("cityPlaceholder")}
                    error={errors.cityOther}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">
                {t("completeDeliveryAddress")}
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("addressPlaceholder")}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base"
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("addressHelper")}</p>
              {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
            </div>
            <Field
              label={t("landmark")}
              value={landmark}
              onChange={setLandmark}
              placeholder={t("landmarkPlaceholder")}
            />
          </form>

          <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">{t("yourOrder")}</h2>
            <div className="space-y-3">
              {lines.map((l) => (
                <div key={`${l.productId}-${l.size}`} className="flex gap-3">
                  <img
                    src={l.product.images[0] || "/logo.png"}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-semibold">{l.product.name}</div>
                    <div className="text-muted-foreground">
                      {t("sizeLabel")} {l.size} • {t("qtyLabel")} {l.quantity}
                    </div>
                    <div className="font-semibold">{formatPKR(l.product.price * l.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-border pt-3 text-sm">
              <SumRow label={t("products")} value={formatPKR(subtotal)} />
              <SumRow
                label={t("delivery")}
                value={delivery === 0 ? t("freeDelivery") : formatPKR(delivery)}
              />
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <div className="text-sm text-muted-foreground">{t("youWillPay")}</div>
              <div className="text-2xl font-extrabold">{formatPKR(total)}</div>
            </div>

            {/* Payment methods */}
            <div>
              <div className="mb-2 text-sm font-bold">{t("selectPaymentMethod")}</div>
              <div className="space-y-3">
                {[
                  { val: "cod", label: t("codLabel") },
                  { val: "easypaisa", label: t("easypaisaLabel") },
                  { val: "meezan", label: t("meezanLabel") },
                ].map(({ val, label }) => (
                  <label
                    key={val}
                    className={`block cursor-pointer rounded-xl border p-4 ${paymentMethod === val ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value={val}
                        checked={paymentMethod === val}
                        onChange={() => setPaymentMethod(val)}
                        className="h-4 w-4 text-primary"
                      />
                      <div className="font-bold text-foreground">{label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {paymentMethod === "easypaisa" && (
              <div className="rounded-xl bg-secondary p-4 text-sm">
                <div className="mb-1 font-bold text-foreground">{t("easypaisaDetails")}</div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2">
                  <span className="font-mono text-base font-semibold">03170363100</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText("03170363100")}
                    className="text-xs font-bold text-primary"
                  >
                    {t("copyBtn")}
                  </button>
                </div>
                <p className="mt-2 font-semibold text-destructive">{t("completePaymentFirst")}</p>
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {t("uploadScreenshot")}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                  {proofFile && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600">✅ {proofFile.name}</p>
                  )}
                </div>
              </div>
            )}

            {paymentMethod === "meezan" && (
              <div className="rounded-xl bg-secondary p-4 text-sm">
                <div className="mb-1 font-bold text-foreground">{t("meezanDetails")}</div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2">
                  <span className="font-mono text-base font-semibold">00300115118325</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText("00300115118325")}
                    className="text-xs font-bold text-primary"
                  >
                    {t("copyBtn")}
                  </button>
                </div>
                <p className="mt-2 font-semibold text-destructive">{t("completePaymentFirst")}</p>
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    {t("uploadScreenshot")}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                  {proofFile && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600">✅ {proofFile.name}</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleReviewClick}
              className="w-full rounded-xl bg-primary py-5 text-lg font-extrabold text-primary-foreground hover:bg-primary/90"
            >
              {t("placeMyOrder")}
            </button>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Lock className="h-3 w-3" /> {t("infoSafe")}
              </li>
              <li className="flex items-center gap-2">
                <Wallet className="h-3 w-3" /> {t("payWhenArrives")}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3 w-3" /> {t("mayCall")}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> {t("noAccountNeeded")}
              </li>
            </ul>
          </aside>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-6 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold">{t("pleaseCheckOrder")}</h3>
              <button onClick={() => setShowConfirm(false)} aria-label="Close" className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {lines.map((l) => (
                <div key={`${l.productId}-${l.size}`} className="flex justify-between">
                  <span>
                    {l.product.name} ({t("sizeLabel")} {l.size}) × {l.quantity}
                  </span>
                  <span className="font-semibold">{formatPKR(l.product.price * l.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2">
                <div className="flex justify-between text-lg font-extrabold">
                  <span>{t("totalLabel")}</span>
                  <span>{formatPKR(total)}</span>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("deliverTo")}
                </div>
                <div className="mt-1 font-semibold">{name}</div>
                <div>{phone}</div>
                <div>{address}</div>
                <div>
                  {finalCity}
                  {landmark ? `, ${landmark}` : ""}
                </div>
              </div>
              <div className="text-center text-sm font-semibold text-primary">{paymentDisplay}</div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                disabled={submitting}
                onClick={placeOrder}
                className="w-full rounded-xl bg-primary py-4 text-base font-extrabold text-primary-foreground disabled:opacity-60"
              >
                {submitting ? t("creatingOrder") : t("yesPlaceOrder")}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-xl border border-border py-3 text-sm font-semibold"
              >
                {t("changeDetails")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Confirmation Popup ── */}
      {emailPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="overflow-hidden rounded-3xl bg-background shadow-2xl border border-border">
              {/* Top accent bar */}
              <div className="h-2 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

              <div className="p-8 text-center">
                {/* Icon */}
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-10 w-10 text-primary" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-extrabold text-foreground">
                  🎉 {t("orderPlaced")}
                </h2>

                {/* Order number badge */}
                <div className="mx-auto mt-4 inline-block rounded-2xl bg-primary/10 px-5 py-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-primary/70">
                    {t("orderNumber")}
                  </div>
                  <div className="mt-1 text-2xl font-black tracking-wider text-primary">
                    #{emailPopup.orderNumber}
                  </div>
                </div>

                {/* Email message */}
                <p className="mt-5 text-base font-semibold leading-relaxed text-foreground">
                  {t("checkEmailNotification")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("emailSentTo")}:{" "}
                  <span className="font-bold text-primary">{emailPopup.email}</span>
                </p>

                {/* CTA button */}
                <button
                  onClick={() => {
                    navigate({
                      to: "/order-success/$orderNumber",
                      params: { orderNumber: emailPopup.orderNumber },
                    });
                    setEmailPopup(null);
                  }}
                  className="mt-8 w-full rounded-2xl bg-primary py-4 text-base font-extrabold text-primary-foreground shadow-lg transition hover:bg-primary/90 active:scale-95"
                >
                  {t("trackMyOrder")} →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  helper,
  type = "text",
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base"
      />
      {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
