import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart-context";
import { LanguageProvider, useLanguage } from "@/lib/language-context";

function NotFoundComponent() {
  const { t, lang } = useLanguage();
  const isUrdu = lang === "ur";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className={`max-w-md ${isUrdu ? "text-right" : "text-center"}`}>
        <h1 className="text-7xl font-bold text-foreground" dir="ltr">404</h1>
        <h2
          className={`mt-4 font-semibold text-foreground ${
            isUrdu ? "text-xl sm:text-2xl leading-[1.8]" : "text-2xl"
          }`}
        >
          {t("notFoundTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFoundText")}</p>
        <div className={`mt-6 flex flex-wrap gap-2 ${isUrdu ? "justify-end" : "justify-center"}`}>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            style={{ minHeight: "48px" }}
          >
            {t("goToHome")}
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold"
            style={{ minHeight: "48px" }}
          >
            {t("shopShoesLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useLanguage();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("somethingWentWrong")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("tryAgainText")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            style={{ minHeight: "44px" }}
          >
            {t("tryAgain")}
          </button>
          <a
            href="/"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold"
            style={{ minHeight: "44px", display: "inline-flex", alignItems: "center" }}
          >
            {t("goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ZORO - Comfortable Shoes, Cash on Delivery" },
      {
        name: "description",
        content:
          "Buy quality shoes online in Pakistan. Cash on Delivery, easy size exchange, delivery all over Pakistan.",
      },
      { property: "og:title", content: "ZORO - Shoes with Cash on Delivery" },
      {
        property: "og:description",
        content: "Comfortable shoes delivered anywhere in Pakistan. Pay cash when your order arrives.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo.png", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponentWrapper,
  errorComponent: ErrorComponent,
});

function NotFoundComponentWrapper() {
  return (
    <LanguageProvider>
      <NotFoundComponent />
    </LanguageProvider>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <Outlet />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
