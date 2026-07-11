import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/size-guide")({
  head: () => ({ meta: [{ title: "Size Guide - ZORO" }] }),
  component: SizeGuidePage,
});

const SIZE_ROWS = [
  { cm: "23.5", eu: 37 },
  { cm: "24.0", eu: 38 },
  { cm: "24.5", eu: 39 },
  { cm: "25.0", eu: 40 },
  { cm: "25.5", eu: 41 },
  { cm: "26.0", eu: 42 },
  { cm: "26.5", eu: 43 },
  { cm: "27.0", eu: 44 },
  { cm: "27.5", eu: 45 },
];

function SizeGuidePage() {
  const { t } = useLanguage();
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-extrabold">{t("sizeGuideTitle")}</h1>
        <p className="mb-6 text-muted-foreground">{t("sizeGuideSub")}</p>
        <ol className="mb-6 list-inside list-decimal space-y-2 text-base text-foreground rounded-2xl border border-border bg-card p-5">
          <li>{t("sizeGuideStep1")}</li>
          <li>{t("sizeGuideStep2")}</li>
          <li>{t("sizeGuideStep3")}</li>
          <li>{t("sizeGuideStep4")}</li>
          <li>{t("sizeGuideStep5")}</li>
        </ol>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-bold">{t("footLength")}</th>
                <th className="px-4 py-3 text-left font-bold">{t("shoeSize")}</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_ROWS.map((r) => (
                <tr
                  key={r.eu}
                  className="border-t border-border odd:bg-background even:bg-secondary/30"
                >
                  <td className="px-4 py-3">{r.cm} cm</td>
                  <td className="px-4 py-3 font-bold">{r.eu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          {t("sizeGuideConfused")}{" "}
          <a
            href="https://wa.me/923170363100"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline"
          >
            {t("messageUsWhatsApp")}
          </a>
        </p>
      </div>
    </Layout>
  );
}
