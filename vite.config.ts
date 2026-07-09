// @lovable.dev/vite-tanstack-config already includes the following - do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const apiHandler = "./api/[...path].js";

export default defineConfig({
  nitro: {
    preset: "vercel",
    handlers: [
      { route: "/api/health", handler: apiHandler, format: "node" },
      { route: "/api/products", handler: apiHandler, format: "node" },
      { route: "/api/products/men", handler: apiHandler, format: "node" },
      { route: "/api/products/women", handler: apiHandler, format: "node" },
      { route: "/api/products/:slug", handler: apiHandler, format: "node" },
      { route: "/api/admin/auth/login", handler: apiHandler, format: "node" },
      { route: "/api/admin/auth/logout", handler: apiHandler, format: "node" },
      { route: "/api/admin/auth/me", handler: apiHandler, format: "node" },
      { route: "/api/admin/dashboard/summary", handler: apiHandler, format: "node" },
      { route: "/api/admin/dashboard/revenue", handler: apiHandler, format: "node" },
      { route: "/api/admin/dashboard/orders", handler: apiHandler, format: "node" },
      { route: "/api/admin/dashboard/payment-methods", handler: apiHandler, format: "node" },
      { route: "/api/admin/dashboard/order-statuses", handler: apiHandler, format: "node" },
      { route: "/api/admin/dashboard/gender-sales", handler: apiHandler, format: "node" },
      { route: "/api/admin/dashboard/top-products", handler: apiHandler, format: "node" },
      { route: "/api/admin/dashboard/customers", handler: apiHandler, format: "node" },
      { route: "/api/admin/products", handler: apiHandler, format: "node" },
      { route: "/api/admin/products/by-id", handler: apiHandler, format: "node" },
      { route: "/api/admin/products/status", handler: apiHandler, format: "node" },
      { route: "/api/admin/products/inventory", handler: apiHandler, format: "node" },
      { route: "/api/admin/products/:id", handler: apiHandler, format: "node" },
      { route: "/api/admin/products/:id/status", handler: apiHandler, format: "node" },
      { route: "/api/admin/products/:id/inventory", handler: apiHandler, format: "node" },
      { route: "/api/admin/orders", handler: apiHandler, format: "node" },
      { route: "/api/admin/orders/by-id", handler: apiHandler, format: "node" },
      { route: "/api/admin/orders/status", handler: apiHandler, format: "node" },
      { route: "/api/admin/orders/payment-status", handler: apiHandler, format: "node" },
      { route: "/api/admin/orders/:id", handler: apiHandler, format: "node" },
      { route: "/api/admin/orders/:id/status", handler: apiHandler, format: "node" },
      { route: "/api/admin/orders/:id/payment-status", handler: apiHandler, format: "node" },
      { route: "/api/admin/upload", handler: apiHandler, format: "node" },
      { route: "/api/orders", handler: apiHandler, format: "node" },
      { route: "/api/orders/track", handler: apiHandler, format: "node" },
      { route: "/api/admin/dashboard/**", handler: apiHandler, format: "node" },
      { route: "/api/admin/orders/**", handler: apiHandler, format: "node" },
      { route: "/api/admin/products/**", handler: apiHandler, format: "node" },
      { route: "/api/admin/upload/**", handler: apiHandler, format: "node" },
      { route: "/api/admin/**", handler: apiHandler, format: "node" },
      { route: "/api/orders/**", handler: apiHandler, format: "node" },
      { route: "/api/products/**", handler: apiHandler, format: "node" },
      { route: "/api/**", handler: apiHandler, format: "node" },
    ],
    vercel: {
      entryFormat: "node",
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
