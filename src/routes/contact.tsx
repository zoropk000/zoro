import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { siteConfig } from "@/config/siteConfig";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Us - ZORO" }] }),
  component: ContactPage,
});

function ContactPage() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  return (
    <Layout>
      <div className={`mx-auto max-w-2xl px-4 py-10 ${isUrdu ? "text-right" : ""}`}>
        <h1 className={`mb-2 font-extrabold ${isUrdu ? "text-2xl sm:text-3xl leading-[1.7]" : "text-3xl"}`}>
          {t("contactTitle")}
        </h1>
        <p className="mb-6 text-muted-foreground">{t("contactSub")}</p>
        <div className="space-y-3">
          <a
            href={`https://wa.me/${siteConfig.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-secondary ${isUrdu ? "flex-row-reverse" : ""}`}
            style={{ minHeight: "64px" }}
          >
            <MessageCircle className="h-6 w-6 flex-shrink-0 text-whatsapp" />
            <div>
              <div className="font-bold">{t("whatsappUs")}</div>
              <div dir="ltr" className="ltr-content text-sm text-muted-foreground">{siteConfig.phone}</div>
            </div>
          </a>
          <a
            href={`tel:${siteConfig.phone}`}
            className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-secondary ${isUrdu ? "flex-row-reverse" : ""}`}
            style={{ minHeight: "64px" }}
          >
            <Phone className="h-6 w-6 flex-shrink-0 text-primary" />
            <div>
              <div className="font-bold">{t("callUs")}</div>
              <div dir="ltr" className="ltr-content text-sm text-muted-foreground">{siteConfig.phone}</div>
            </div>
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-secondary ${isUrdu ? "flex-row-reverse" : ""}`}
            style={{ minHeight: "64px" }}
          >
            <Mail className="h-6 w-6 flex-shrink-0 text-primary" />
            <div>
              <div className="font-bold">{t("email")}</div>
              <div className="break-all text-sm text-muted-foreground">{siteConfig.email}</div>
            </div>
          </a>
        </div>
      </div>
    </Layout>
  );
}
