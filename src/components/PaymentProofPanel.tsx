import { useState } from "react";
import { CheckCircle2, Clock3, Upload, AlertCircle, Wallet } from "lucide-react";
import { uploadPaymentProof, type TrackedOrder } from "@/services/orderService";
import { useLanguage } from "@/lib/language-context";

export function PaymentProofPanel({
  order,
  onUploaded,
}: {
  order: TrackedOrder;
  onUploaded: () => void | Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { lang } = useLanguage();
  const copy = (en: string, ur: string) => (lang === "ur" ? ur : en);
  if (order.paymentMethod === "cod")
    return (
      <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <Wallet size={17} />
          {copy("Cash on delivery", "کیش آن ڈیلیوری")}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {order.paymentStatus === "paid"
            ? copy("Payment received. Thank you.", "ادائیگی موصول ہو گئی۔ شکریہ۔")
            : copy(
                "Pay the courier when your order arrives. No screenshot is needed.",
                "آرڈر موصول ہونے پر کورئیر کو ادائیگی کریں۔ اسکرین شاٹ کی ضرورت نہیں۔",
              )}
        </p>
      </div>
    );
  if (order.paymentStatus === "paid")
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <div className="flex items-center gap-2 font-bold">
          <CheckCircle2 size={19} />
          {copy("Payment approved", "ادائیگی منظور ہو گئی")}
        </div>
        <p className="mt-2 text-xs">
          {copy(
            "Our team has verified your payment. Follow your delivery progress below.",
            "ہماری ٹیم نے آپ کی ادائیگی کی تصدیق کر دی ہے۔ ڈیلیوری کی پیش رفت نیچے دیکھیں۔",
          )}
        </p>
      </div>
    );
  if (order.orderStatus === "cancelled") return null;
  const reviewing = order.hasPaymentProof && order.paymentStatus === "verification-needed";
  return (
    <section
      className="rounded-xl border border-border p-4 text-left"
      dir={lang === "ur" ? "rtl" : "ltr"}
    >
      <h3 className="flex items-center gap-2 text-sm font-bold">
        {reviewing ? <Clock3 size={18} /> : <Upload size={18} />}
        {reviewing
          ? copy("Payment screenshot under review", "ادائیگی کے اسکرین شاٹ کا جائزہ لیا جا رہا ہے")
          : order.paymentStatus === "failed"
            ? copy(
                "Please upload a new payment screenshot",
                "براہ کرم ادائیگی کا نیا اسکرین شاٹ اپ لوڈ کریں",
              )
            : copy("Upload your payment screenshot", "اپنی ادائیگی کا اسکرین شاٹ اپ لوڈ کریں")}
      </h3>
      {order.paymentReviewNote && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          {copy("Admin note: ", "ایڈمن کا پیغام: ")}
          {order.paymentReviewNote}
        </p>
      )}
      {reviewing ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {copy(
            "Your screenshot was received. We’ll update the payment status here after review. Your order will be confirmed once payment is approved.",
            "آپ کا اسکرین شاٹ موصول ہو گیا ہے۔ جائزے کے بعد ادائیگی کی صورتحال یہاں اپ ڈیٹ ہو جائے گی۔ ادائیگی منظور ہونے پر آرڈر کی تصدیق ہو گی۔",
          )}
          {order.paymentProofUploadedAt && (
            <span className="mt-2 block">
              {new Date(order.paymentProofUploadedAt).toLocaleString(
                lang === "ur" ? "ur-PK" : "en-PK",
              )}
            </span>
          )}
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {copy(
              "Complete your transfer, then upload a clear screenshot showing the amount, date and transaction reference. JPG, PNG or WEBP, up to 4 MB.",
              "ادائیگی مکمل کرنے کے بعد رقم، تاریخ اور ٹرانزیکشن نمبر کا واضح اسکرین شاٹ اپ لوڈ کریں۔ JPG، PNG یا WEBP، زیادہ سے زیادہ 4 MB۔",
            )}
          </p>
          <input
            aria-label="Payment screenshot"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={pending}
            className="mt-4 w-full text-xs file:mr-3 file:border-0 file:bg-secondary file:px-3 file:py-2"
            onChange={(event) => {
              const next = event.target.files?.[0];
              setError("");
              if (
                next &&
                (!["image/jpeg", "image/png", "image/webp"].includes(next.type) ||
                  next.size > 4 * 1024 * 1024)
              ) {
                setError("Choose a JPG, PNG or WEBP image under 4 MB.");
                setFile(null);
                event.target.value = "";
              } else setFile(next || null);
            }}
          />
          {error && (
            <p role="alert" className="form-error mt-3 text-xs">
              <AlertCircle className="mr-2 inline" size={13} />
              {error}
            </p>
          )}
          <button
            className="store-button mt-4 w-full"
            disabled={!file || pending || !order.paymentProofToken}
            onClick={async () => {
              if (!file || !order.paymentProofToken) return;
              setPending(true);
              setError("");
              try {
                await uploadPaymentProof(order.orderNumber, order.paymentProofToken, file);
                setFile(null);
                await onUploaded();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Screenshot upload failed. Please try again.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            {pending
              ? copy("Uploading…", "اپ لوڈ ہو رہا ہے…")
              : copy("Send screenshot for approval", "منظوری کے لیے اسکرین شاٹ بھیجیں")}
          </button>
        </>
      )}
    </section>
  );
}
