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
  const { t } = useLanguage();
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-extrabold">{t("contactTitle")}</h1>
        <p className="mb-6 text-muted-foreground">{t("contactSub")}</p>
        <div className="space-y-3">
          <a
            href={`https://wa.me/${siteConfig.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-secondary"
          >
            <MessageCircle className="h-6 w-6 text-whatsapp" />
            <div>
              <div className="font-bold">{t("whatsappUs")}</div>
              <div className="text-sm text-muted-foreground">{siteConfig.phone}</div>
            </div>
          </a>
          <a
            href={`tel:${siteConfig.phone}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-secondary"
          >
            <Phone className="h-6 w-6 text-primary" />
            <div>
              <div className="font-bold">{t("callUs")}</div>
              <div className="text-sm text-muted-foreground">{siteConfig.phone}</div>
            </div>
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-secondary"
          >
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <div className="font-bold">{t("email")}</div>
              <div className="text-sm text-muted-foreground">{siteConfig.email}</div>
            </div>
          </a>
        </div>
      </div>
    </Layout>
  );
}
