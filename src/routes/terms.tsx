import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions - ZORO" }] }),
  component: TermsPage,
});

function TermsPage() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  return (
    <Layout>
      <div className={`mx-auto max-w-2xl px-4 py-10 ${isUrdu ? "text-right" : ""}`}>
        <h1 className={`mb-6 font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
          {t("termsTitle")}
        </h1>
        <div className="space-y-4 text-muted-foreground">
          <p>{t("termsP1")}</p>
          <p>{t("termsP2")}</p>
        </div>
      </div>
    </Layout>
  );
}
