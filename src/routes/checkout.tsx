import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useCart } from "@/lib/cart-context";
import { formatPKR } from "@/lib/currency";
import { calcDeliveryFee, generateOrderNumber, saveOrder, type SavedOrder } from "@/lib/orders";
import { pakistaniCities } from "@/data/cities";
import { validatePakistaniPhone, normalizePhone } from "@/lib/validation";
import { Lock, Phone, ShieldCheck, Wallet, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout - ZORO" }] }),
  component: CheckoutPage,
});

type Errors = Partial<Record<"name" | "phone" | "city" | "cityOther" | "address", string>>;

function CheckoutPage() {
  const { lines, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  const delivery = calcDeliveryFee(subtotal);
  const total = subtotal + delivery;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    if (lines.length === 0) navigate({ to: "/cart" });
  }, [lines.length, navigate]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = t("errName");
    if (!phone.trim()) e.phone = t("errPhone");
    else if (!validatePakistaniPhone(phone)) e.phone = t("errPhoneInvalid");
    if (!city) e.city = t("errCity");
    if (city === "Other" && !cityOther.trim()) e.cityOther = t("errCityOther");
    if (!address.trim()) e.address = t("errAddress");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReviewClick = () => {
    if (validate()) setShowConfirm(true);
  };

  const placeOrder = () => {
    const order: SavedOrder = {
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      name: name.trim(),
      phone: normalizePhone(phone),
      city: city === "Other" ? cityOther.trim() : city,
      address: address.trim(),
      landmark: landmark.trim() || undefined,
      items: lines.map((l) => ({
        productId: l.productId,
        name: l.product.name,
        image: l.product.images[0],
        size: l.size,
        quantity: l.quantity,
        price: l.product.price,
      })),
      subtotal,
      deliveryFee: delivery,
      total,
      paymentMethod,
      status: "Received",
    };
    saveOrder(order);
    clearCart();
    setShowConfirm(false);
    navigate({ to: "/order-success", search: { order: order.orderNumber } });
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
        <div className={`mb-6 ${isUrdu ? "text-right" : "text-center"}`}>
          <h1 className={`font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
            {t("completeYourOrder")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("checkoutSubtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleReviewClick(); }}
            className={`space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6 ${isUrdu ? "text-right" : ""}`}
          >
            <Field
              label={t("yourFullName")}
              value={name}
              onChange={setName}
              placeholder={t("namePlaceholder")}
              error={errors.name}
              autoComplete="name"
              isUrdu={isUrdu}
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
              isUrdu={isUrdu}
              alwaysLtr  /* phone always LTR */
            />
            <div>
              <label className={`mb-1 block text-sm font-semibold ${isUrdu ? "text-right" : ""}`}>
                {t("city")}
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base"
                style={{
                  minHeight: "52px",
                  direction: isUrdu ? "rtl" : "ltr",
                  textAlign: isUrdu ? "right" : "left",
                }}
              >
                <option value="">{t("selectYourCity")}</option>
                {pakistaniCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.city && <p className={`mt-1 text-sm text-destructive ${isUrdu ? "text-right" : ""}`}>{errors.city}</p>}
              {city === "Other" && (
                <div className="mt-3">
                  <Field
                    label={t("enterCityName")}
                    value={cityOther}
                    onChange={setCityOther}
                    placeholder={t("cityPlaceholder")}
                    error={errors.cityOther}
                    isUrdu={isUrdu}
                  />
                </div>
              )}
            </div>

            <div>
              <label className={`mb-1 block text-sm font-semibold ${isUrdu ? "text-right" : ""}`}>
                {t("completeDeliveryAddress")}
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("addressPlaceholder")}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base"
                dir={isUrdu ? "rtl" : "ltr"}
                style={{ textAlign: isUrdu ? "right" : "left", minHeight: "80px" }}
              />
              <p className={`mt-1 text-xs text-muted-foreground ${isUrdu ? "text-right" : ""}`}>
                {t("addressHelper")}
              </p>
              {errors.address && <p className={`mt-1 text-sm text-destructive ${isUrdu ? "text-right" : ""}`}>{errors.address}</p>}
            </div>

            <Field
              label={t("landmark")}
              value={landmark}
              onChange={setLandmark}
              placeholder={t("landmarkPlaceholder")}
              isUrdu={isUrdu}
            />
          </form>

          {/* Order summary aside */}
          <aside className={`h-fit space-y-4 rounded-2xl border border-border bg-card p-5 ${isUrdu ? "text-right" : ""}`}>
            <h2 className={`font-bold ${isUrdu ? "text-lg leading-[1.8]" : "text-lg"}`}>
              {t("yourOrder")}
            </h2>

            <div className="space-y-3">
              {lines.map((l) => (
                <div
                  key={`${l.productId}-${l.size}`}
                  className={`flex gap-3 ${isUrdu ? "flex-row-reverse" : ""}`}
                >
                  <div className="image-overflow h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                    <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className={`flex-1 text-sm ${isUrdu ? "text-right" : ""}`}>
                    <div className="font-semibold">{l.product.name}</div>
                    <div className="text-muted-foreground">
                      {t("sizeLabel")}{" "}
                      <span dir="ltr" className="ltr-content">{l.size}</span>
                      {" • "}{t("qtyLabel")}{" "}
                      <span dir="ltr" className="ltr-content">{l.quantity}</span>
                    </div>
                    <div className="ltr-content font-semibold">{formatPKR(l.product.price * l.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`space-y-1 border-t border-border pt-3 text-sm ${isUrdu ? "" : ""}`}>
              <SumRow label={t("products")} value={formatPKR(subtotal)} isUrdu={isUrdu} />
              <SumRow
                label={t("delivery")}
                value={delivery === 0 ? t("freeDelivery") : formatPKR(delivery)}
                isUrdu={isUrdu}
              />
            </div>

            <div className={`rounded-xl bg-secondary p-4 ${isUrdu ? "text-right" : ""}`}>
              <div className="text-sm text-muted-foreground">{t("youWillPay")}</div>
              <div className="ltr-content text-2xl font-extrabold">{formatPKR(total)}</div>
            </div>

            {/* Payment methods */}
            <div>
              <div className={`mb-2 text-sm font-bold ${isUrdu ? "text-right" : ""}`}>
                {t("selectPaymentMethod")}
              </div>
              <div className="space-y-3">
                {[
                  { val: "cod", label: t("codLabel") },
                  { val: "easypaisa", label: t("easypaisaLabel") },
                  { val: "meezan", label: t("meezanLabel") },
                ].map(({ val, label }) => (
                  <label
                    key={val}
                    className={`payment-card block cursor-pointer rounded-xl border p-4 ${
                      paymentMethod === val ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                    style={{ minHeight: "60px" }}
                  >
                    <div className={`flex items-center gap-3 ${isUrdu ? "flex-row-reverse" : ""}`}>
                      <input
                        type="radio"
                        name="payment"
                        value={val}
                        checked={paymentMethod === val}
                        onChange={() => setPaymentMethod(val)}
                        className="h-4 w-4 flex-shrink-0 text-primary"
                      />
                      <div className="font-bold text-foreground">{label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {paymentMethod === "easypaisa" && (
              <div className={`rounded-xl bg-secondary p-4 text-sm ${isUrdu ? "text-right" : ""}`}>
                <div className="mb-1 font-bold text-foreground">{t("easypaisaDetails")}</div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2">
                  {/* Account number ALWAYS LTR */}
                  <span dir="ltr" className="payment-number font-mono text-base font-semibold">
                    03170363100
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText("03170363100")}
                    className="text-xs font-bold text-primary"
                    style={{ minHeight: "32px" }}
                  >
                    {t("copyBtn")}
                  </button>
                </div>
                <p className="mt-2 font-semibold text-destructive">{t("completePaymentFirst")}</p>
                <div className="mt-3">
                  <label className={`mb-1 block text-xs font-semibold text-muted-foreground ${isUrdu ? "text-right" : ""}`}>
                    {t("uploadScreenshot")}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "meezan" && (
              <div className={`rounded-xl bg-secondary p-4 text-sm ${isUrdu ? "text-right" : ""}`}>
                <div className="mb-1 font-bold text-foreground">{t("meezanDetails")}</div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2">
                  {/* Bank account number ALWAYS LTR */}
                  <span dir="ltr" className="payment-number font-mono text-base font-semibold">
                    00300115118325
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText("00300115118325")}
                    className="text-xs font-bold text-primary"
                    style={{ minHeight: "32px" }}
                  >
                    {t("copyBtn")}
                  </button>
                </div>
                <p className="mt-2 font-semibold text-destructive">{t("completePaymentFirst")}</p>
                <div className="mt-3">
                  <label className={`mb-1 block text-xs font-semibold text-muted-foreground ${isUrdu ? "text-right" : ""}`}>
                    {t("uploadScreenshot")}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleReviewClick}
              className="w-full rounded-xl bg-primary py-5 text-base font-extrabold text-primary-foreground hover:bg-primary/90"
              style={{ minHeight: "60px" }}
            >
              {t("placeMyOrder")}
            </button>

            <ul className={`space-y-1.5 text-xs text-muted-foreground ${isUrdu ? "text-right" : ""}`}>
              {[
                { icon: <Lock className="h-3 w-3 flex-shrink-0" />, text: t("infoSafe") },
                { icon: <Wallet className="h-3 w-3 flex-shrink-0" />, text: t("payWhenArrives") },
                { icon: <Phone className="h-3 w-3 flex-shrink-0" />, text: t("mayCall") },
                { icon: <ShieldCheck className="h-3 w-3 flex-shrink-0" />, text: t("noAccountNeeded") },
              ].map(({ icon, text }, i) => (
                <li key={i} className={`flex items-start gap-2 ${isUrdu ? "flex-row-reverse" : ""}`}>
                  <span className="mt-0.5">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      {/* Order confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-6 sm:rounded-2xl"
            dir={isUrdu ? "rtl" : "ltr"}
          >
            <div className={`mb-4 flex items-center justify-between ${isUrdu ? "flex-row-reverse" : ""}`}>
              <h3 className={`font-extrabold ${isUrdu ? "text-lg leading-[1.7]" : "text-xl"}`}>
                {t("pleaseCheckOrder")}
              </h3>
              <button onClick={() => setShowConfirm(false)} aria-label="Close" className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {lines.map((l) => (
                <div key={`${l.productId}-${l.size}`} className={`flex justify-between ${isUrdu ? "flex-row-reverse" : ""}`}>
                  <span>
                    {l.product.name} ({t("sizeLabel")}{" "}
                    <span dir="ltr" className="ltr-content">{l.size}</span>) ×{" "}
                    <span dir="ltr" className="ltr-content">{l.quantity}</span>
                  </span>
                  <span className="ltr-content font-semibold">{formatPKR(l.product.price * l.quantity)}</span>
                </div>
              ))}

              <div className="border-t border-border pt-2">
                <div className={`flex text-lg font-extrabold ${isUrdu ? "flex-row-reverse" : "justify-between"}`}>
                  <span>{t("totalLabel")}</span>
                  <span dir="ltr" className="ltr-content">{formatPKR(total)}</span>
                </div>
              </div>

              <div className={`rounded-lg bg-secondary p-3 ${isUrdu ? "text-right" : ""}`}>
                <div className="text-xs font-semibold uppercase text-muted-foreground">{t("deliverTo")}</div>
                <div className="mt-1 font-semibold">{name}</div>
                <div dir="ltr" className="ltr-content">{phone}</div>
                <div>{address}</div>
                <div>{finalCity}{landmark ? `, ${landmark}` : ""}</div>
              </div>

              <div className="text-center text-sm font-semibold text-primary">{paymentDisplay}</div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={placeOrder}
                className="w-full rounded-xl bg-primary py-4 text-base font-extrabold text-primary-foreground"
                style={{ minHeight: "52px" }}
              >
                {t("yesPlaceOrder")}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-xl border border-border py-3 text-sm font-semibold"
                style={{ minHeight: "48px" }}
              >
                {t("changeDetails")}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function SumRow({ label, value, isUrdu }: { label: string; value: string; isUrdu?: boolean }) {
  return (
    <div className={`flex ${isUrdu ? "flex-row-reverse" : "justify-between"}`}>
      <span className="text-muted-foreground">{label}</span>
      <span dir="ltr" className="ltr-content font-semibold">{value}</span>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, error, helper, type = "text",
  inputMode, autoComplete, isUrdu, alwaysLtr,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; helper?: string; type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric"; autoComplete?: string;
  isUrdu?: boolean; alwaysLtr?: boolean;
}) {
  const inputDir = alwaysLtr ? "ltr" : isUrdu ? "rtl" : "ltr";
  const textAlign = alwaysLtr ? "left" : isUrdu ? "right" : "left";
  return (
    <div className="checkout-field">
      <label className={`mb-1 block text-sm font-semibold ${isUrdu ? "text-right" : ""}`}>{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={inputDir}
        className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base"
        style={{ minHeight: "52px", textAlign, direction: inputDir }}
      />
      {helper && (
        <p className={`mt-1 text-xs text-muted-foreground ${isUrdu ? "text-right" : ""}`}>{helper}</p>
      )}
      {error && (
        <p className={`mt-1 text-sm text-destructive ${isUrdu ? "text-right" : ""}`}>{error}</p>
      )}
    </div>
  );
}
