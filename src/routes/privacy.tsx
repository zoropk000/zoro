import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy - ZORO" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  return (
    <Layout>
      <div className={`mx-auto max-w-2xl px-4 py-10 ${isUrdu ? "text-right" : ""}`}>
        <h1 className={`mb-6 font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
          {t("privacyTitle")}
        </h1>
        <div className="space-y-4 text-muted-foreground">
          <p>{t("privacyP1")}</p>
          <p>{t("privacyP2")}</p>
          <p>{t("privacyP3")}</p>
        </div>
      </div>
    </Layout>
  );
}
