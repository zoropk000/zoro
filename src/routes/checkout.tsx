import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useCart } from "@/lib/cart-context";
import { formatPKR } from "@/lib/currency";
import { calcDeliveryFee, generateOrderNumber, saveOrder, type SavedOrder } from "@/lib/orders";
import { pakistaniCities } from "@/data/cities";
import { validatePakistaniPhone, normalizePhone } from "@/lib/validation";
import { Lock, Phone, ShieldCheck, Wallet, X } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — StepStyle Pakistan" }] }),
  component: CheckoutPage,
});

type Errors = Partial<Record<"name" | "phone" | "city" | "cityOther" | "address", string>>;

function CheckoutPage() {
  const { lines, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (lines.length === 0) {
      navigate({ to: "/cart" });
    }
  }, [lines.length, navigate]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Please enter your name.";
    if (!phone.trim()) e.phone = "Please enter your mobile number.";
    else if (!validatePakistaniPhone(phone))
      e.phone = "Please enter a valid Pakistani mobile number, for example 0300 1234567.";
    if (!city) e.city = "Please select your city.";
    if (city === "Other" && !cityOther.trim()) e.cityOther = "Please enter your city name.";
    if (!address.trim()) e.address = "Please enter your complete delivery address.";
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
      status: "Received",
    };
    saveOrder(order);
    clearCart();
    setShowConfirm(false);
    navigate({ to: "/order-success", search: { order: order.orderNumber } });
  };

  const finalCity = city === "Other" ? cityOther : city;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold">Complete Your Order</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your delivery details. Pay cash when your order arrives.
          </p>
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
              label="Your Full Name"
              value={name}
              onChange={setName}
              placeholder="Enter your name"
              error={errors.name}
              autoComplete="name"
            />
            <Field
              label="Mobile Number"
              value={phone}
              onChange={setPhone}
              placeholder="03XX XXXXXXX"
              error={errors.phone}
              helper="We will call or message you to confirm your order."
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
            <div>
              <label className="mb-1 block text-sm font-semibold">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-4 text-base"
              >
                <option value="">Select your city</option>
                {pakistaniCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.city && <p className="mt-1 text-sm text-destructive">{errors.city}</p>}
              {city === "Other" && (
                <div className="mt-3">
                  <Field
                    label="Enter Your City Name"
                    value={cityOther}
                    onChange={setCityOther}
                    placeholder="Your city name"
                    error={errors.cityOther}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Complete Delivery Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House number, street, area, landmark"
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Please write an address where the delivery rider can easily find you.
              </p>
              {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
            </div>
            <Field
              label="Nearby Famous Place or Landmark (Optional)"
              value={landmark}
              onChange={setLandmark}
              placeholder="Example: Near XYZ Masjid or ABC Market"
            />
          </form>

          <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">Your Order</h2>
            <div className="space-y-3">
              {lines.map((l) => (
                <div key={`${l.productId}-${l.size}`} className="flex gap-3">
                  <img src={l.product.images[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <div className="flex-1 text-sm">
                    <div className="font-semibold">{l.product.name}</div>
                    <div className="text-muted-foreground">Size: {l.size} • Qty: {l.quantity}</div>
                    <div className="font-semibold">{formatPKR(l.product.price * l.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-border pt-3 text-sm">
              <SumRow label="Products" value={formatPKR(subtotal)} />
              <SumRow label="Delivery" value={delivery === 0 ? "FREE" : formatPKR(delivery)} />
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <div className="text-sm text-muted-foreground">You will pay:</div>
              <div className="text-2xl font-extrabold">{formatPKR(total)}</div>
            </div>
            <div className="rounded-xl border border-success/40 bg-success/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-success">
                <Wallet className="h-4 w-4" /> Cash on Delivery
              </div>
              <p className="mt-1 text-xs text-success/90">
                Pay cash when your order arrives. No online payment needed.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReviewClick}
              className="w-full rounded-xl bg-primary py-5 text-lg font-extrabold text-primary-foreground hover:bg-primary/90"
            >
              PLACE MY ORDER
            </button>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><Lock className="h-3 w-3" /> Your information is safe.</li>
              <li className="flex items-center gap-2"><Wallet className="h-3 w-3" /> Pay cash when your order arrives.</li>
              <li className="flex items-center gap-2"><Phone className="h-3 w-3" /> We may call to confirm your order.</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> No account needed.</li>
            </ul>
          </aside>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-6 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold">Please Check Your Order</h3>
              <button onClick={() => setShowConfirm(false)} aria-label="Close" className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {lines.map((l) => (
                <div key={`${l.productId}-${l.size}`} className="flex justify-between">
                  <span>{l.product.name} (Size {l.size}) × {l.quantity}</span>
                  <span className="font-semibold">{formatPKR(l.product.price * l.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2">
                <div className="flex justify-between text-lg font-extrabold">
                  <span>Total</span>
                  <span>{formatPKR(total)}</span>
                </div>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Deliver to</div>
                <div className="mt-1 font-semibold">{name}</div>
                <div>{phone}</div>
                <div>{address}</div>
                <div>{finalCity}{landmark ? `, ${landmark}` : ""}</div>
              </div>
              <div className="text-center text-sm font-semibold text-success">
                💵 Cash on Delivery
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={placeOrder}
                className="w-full rounded-xl bg-primary py-4 text-base font-extrabold text-primary-foreground"
              >
                Yes, Place My Order
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-xl border border-border py-3 text-sm font-semibold"
              >
                Change Details
              </button>
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
