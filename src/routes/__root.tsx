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
import { CustomerProvider } from "@/lib/customer-context";
import { LanguageProvider, useLanguage } from "@/lib/language-context";

function NotFoundComponent() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">{t("notFoundTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFoundText")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("goToHome")}
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold"
          >
            {t("shopShoesLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again, or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold"
          >
            Go home
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
      { title: "ZORO — Everyday, elevated. | Shop Pakistan" },
      {
        name: "description",
        content:
          "Discover clothing, shoes, perfumes and accessories at ZORO. Shop your everyday favourites with cash on delivery across Pakistan.",
      },
      { property: "og:title", content: "ZORO — Everyday, elevated." },
      {
        property: "og:description",
        content:
          "Clothing, shoes, perfumes and accessories, delivered across Pakistan. Pay cash on delivery.",
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
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700;750;800&family=Noto+Nastaliq+Urdu:wght@400;600&display=swap",
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
          <CustomerProvider>
            <Outlet />
            <Toaster position="top-center" richColors />
          </CustomerProvider>
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
