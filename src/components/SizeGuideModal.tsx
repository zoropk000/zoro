import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/language-context";

export function SizeGuideModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  const rows = [
    { cm: "24.5", size: 39 }, { cm: "25.0", size: 40 }, { cm: "25.5", size: 41 },
    { cm: "26.0", size: 42 }, { cm: "26.5", size: 43 }, { cm: "27.0", size: 44 },
    { cm: "27.5", size: 45 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-6 sm:rounded-2xl"
        dir={isUrdu ? "rtl" : "ltr"}
      >
        <div className={`mb-4 flex items-center justify-between ${isUrdu ? "flex-row-reverse" : ""}`}>
          <h3 className={`font-bold ${isUrdu ? "text-lg leading-[1.8]" : "text-xl"}`}>
            {t("sizeGuideTitle")}
          </h3>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-secondary" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ol className={`mb-4 space-y-2 text-sm text-foreground ${isUrdu ? "list-none" : "list-inside list-decimal"}`}>
          {[
            t("sizeGuideStep1"), t("sizeGuideStep2"), t("sizeGuideStep3"),
            t("sizeGuideStep4"), t("sizeGuideStep5"),
          ].map((step, i) => (
            <li key={i} className={isUrdu ? "flex items-start gap-2 flex-row-reverse" : ""}>
              {isUrdu && (
                <span dir="ltr" className="ltr-content mt-0.5 flex-shrink-0 font-bold text-primary">
                  {i + 1}.
                </span>
              )}
              {step}
            </li>
          ))}
        </ol>

        {/* Table always LTR - measurements are numbers */}
        <table className="mb-4 w-full text-sm" dir="ltr">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2">{t("footLength")}</th>
              <th className="py-2">{t("shoeSize")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className="border-b border-border/50">
                <td className="py-2">{r.cm} cm</td>
                <td className="py-2 font-semibold">{r.size}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className={`text-sm text-muted-foreground ${isUrdu ? "text-right" : ""}`}>
          {t("sizeGuideConfused")}{" "}
          <Link to="/contact" className="font-semibold text-primary">
            {t("messageUsWhatsApp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
