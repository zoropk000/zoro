import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import type { Plugin } from "vite";

/** Serve the existing Express API on Vite's port during local development. */
export function devApiPlugin(): Plugin {
  const proxyTarget = process.env.ZORO_DEV_API_PROXY;

  return {
    name: "zoro-development-api",
    apply: "serve",
    config() {
      if (!proxyTarget) return;
      const target = new URL(proxyTarget);
      if (!["http:", "https:"].includes(target.protocol)) {
        throw new Error("ZORO_DEV_API_PROXY must be an HTTP(S) backend origin.");
      }
      return {
        server: {
          proxy: {
            "^/api(?:/|$)": { target: target.origin, changeOrigin: false },
          },
        },
      };
    },
    async configureServer(server) {
      if (proxyTarget) return;
      dotenv.config({ path: resolve(server.config.root, "backend/.env") });
      // A native import keeps the backend's own dependency instances and .env loading intact.
      const handlerUrl = pathToFileURL(resolve(server.config.root, "api/[...path].js")).href;
      const { default: handler } = await import(/* @vite-ignore */ handlerUrl);
      server.middlewares.use((req, res, next) => {
        if (!/^\/api(?:\/|\?|$)/.test(req.url || "")) return next();
        void Promise.resolve(handler(req, res)).catch(next);
      });
    },
  };
}
