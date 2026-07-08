import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, Instagram, Facebook } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";

export function Footer() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";

  return (
    <footer className="mt-12 border-t border-border bg-secondary/40 pb-24 pt-10 md:pb-12">
      <div
        className={`mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 md:grid-cols-4 ${
          isUrdu ? "text-right" : ""
        }`}
      >
        {/* Shop */}
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
            {t("footerShop")}
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              { to: "/men", label: t("footerMen") },
              { to: "/women", label: t("footerWomen") },
              { to: "/shop", label: t("footerAllShoes") },
              { to: "/sale", label: t("footerSale") },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to as "/men"} className="transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
            {t("footerHelp")}
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              { to: "/size-guide", label: t("footerSizeGuide") },
              { to: "/track-order", label: t("footerTrackOrder") },
              { to: "/delivery", label: t("footerDelivery") },
              { to: "/returns", label: t("footerReturns") },
              { to: "/faq", label: t("footerFAQ") },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to as "/faq"} className="transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
            {t("footerCompany")}
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              { to: "/about", label: t("footerAbout") },
              { to: "/contact", label: t("footerContact") },
              { to: "/privacy", label: t("footerPrivacy") },
              { to: "/terms", label: t("footerTerms") },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to as "/about"} className="transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
            {t("footerContact2")}
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className={`flex items-start gap-3 ${isUrdu ? "flex-row-reverse" : ""}`}>
              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              {/* Phone always LTR */}
              <span dir="ltr" className="ltr-content">{siteConfig.phone}</span>
            </li>
            <li className={`flex items-start gap-3 ${isUrdu ? "flex-row-reverse" : ""}`}>
              <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>
                {t("footerWhatsApp")}{" "}
                <span dir="ltr" className="ltr-content">{siteConfig.phone}</span>
              </span>
            </li>
            <li className={`flex items-start gap-3 ${isUrdu ? "flex-row-reverse" : ""}`}>
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span className="break-all">{siteConfig.email}</span>
            </li>
          </ul>

          {/* Social Media */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground">
              {t("footerFollowUs")}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Instagram"
                className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-sm transition hover:border-[#E1306C]/40 hover:shadow-md"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5]">
                  <Instagram className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-[#E1306C]">
                  {t("instagram")}
                </span>
              </a>
              <a
                href={siteConfig.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Facebook"
                className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-sm transition hover:border-[#1877F2]/40 hover:shadow-md"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1877F2]">
                  <Facebook className="h-4 w-4 fill-white text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-[#1877F2]">
                  {t("facebook")}
                </span>
              </a>
            </div>
          </div>

          {/* COD badge */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-4 py-2 text-xs font-bold text-success">
            <span className="text-base">💵</span>
            {t("footerCOD")}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="mx-auto mt-8 max-w-7xl border-t border-border px-4 pt-5 text-center text-xs text-muted-foreground">
        <p className="font-medium">{t("footerBottomText")}</p>
        <p className="mt-2">
          © {new Date().getFullYear()} {siteConfig.brandName}. {t("footerCopyright")}
        </p>
      </div>
    </footer>
  );
}