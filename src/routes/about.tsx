import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About - ZORO" }] }),
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  return (
    <Layout>
      <div className={`mx-auto max-w-2xl px-4 py-10 ${isUrdu ? "text-right" : ""}`}>
        <h1 className={`mb-4 font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
          {t("aboutTitle")}
        </h1>
        <p className="mb-4 text-muted-foreground">
          <strong>{siteConfig.brandName}</strong> {t("aboutP1")}
        </p>
        <p className="mb-6 text-muted-foreground">{t("aboutP2")}</p>
        <div className={`rounded-2xl border border-border bg-card p-5 ${isUrdu ? "text-right" : ""}`}>
          <h2 className={`mb-3 font-bold ${isUrdu ? "text-base leading-[1.8]" : "text-lg"}`}>
            {t("aboutWhatWeOffer")}
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ {t("aboutOffer1")}</li>
            <li>✓ {t("aboutOffer2")}</li>
            <li>✓ {t("aboutOffer3")}</li>
            <li>✓ {t("aboutOffer4")}</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
