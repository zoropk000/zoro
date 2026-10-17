// React context, LanguageProvider, and useLanguage hook — must be .tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "./i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      setLangState(stored === "ur" ? "ur" : "en");
    } catch {
      // Keep the default language when storage is unavailable.
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      // Storage can be unavailable in private or embedded browser contexts.
    }
  };

  useEffect(() => {
    const html = document.documentElement;
    if (lang === "ur") {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "ur");
      html.classList.add("urdu");
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", "en");
      html.classList.remove("urdu");
    }
  }, [lang]);

  const t = (key: TranslationKey): string => translations[lang][key] as string;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}

// Re-export types for convenience
export type { Lang, TranslationKey };
