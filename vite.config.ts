// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "prompt",
        injectRegister: false,
        strategies: "generateSW",
        filename: "sw.js",
        // Never run a service worker in dev — would interfere with HMR & Lovable preview.
        devOptions: {
          enabled: false,
        },
        manifest: {
          name: "Fluxo · Finanças",
          short_name: "Fluxo",
          description:
            "Suas finanças pessoais em movimento. Registre receitas e gastos sem planilha.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#0d1218",
          theme_color: "#0d1218",
          icons: [
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icon-512.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff2}"],
          // Do not intercept TanStack-internal or Lovable-internal routes
          navigateFallbackDenylist: [/^\/~/, /^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === "document",
              handler: "NetworkFirst",
              options: {
                cacheName: "fluxo-pages",
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              urlPattern: ({ request }) =>
                ["style", "script", "worker", "font", "image"].includes(request.destination),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "fluxo-assets",
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
  },
});
