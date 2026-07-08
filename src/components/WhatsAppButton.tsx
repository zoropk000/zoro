import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/siteConfig";
import { useLanguage } from "@/lib/language-context";

export function WhatsAppButton({ message }: { message?: string }) {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  const defaultMsg = message ?? t("waDefaultMsg");
  const text = encodeURIComponent(defaultMsg);
  const url = `https://wa.me/${siteConfig.whatsapp}?text=${text}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`whatsapp-float fixed bottom-20 z-30 flex items-center gap-2 rounded-full bg-whatsapp px-4 py-3 text-sm font-bold text-whatsapp-foreground shadow-lg transition hover:scale-105 md:bottom-6 ${
        isUrdu ? "left-4" : "right-4"
      }`}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5 flex-shrink-0" />
      <span className="hidden sm:inline">{t("needHelp")}</span>
    </a>
  );
}
