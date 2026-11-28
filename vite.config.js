import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeManifestIcons: false,
      manifest: {
        id: "/",
        name: "Hogar Seguro — Prevención de Caídas",
        short_name: "Hogar Seguro",
        description:
          "Evaluación preventiva de riesgo de caídas, plano interactivo del hogar y plan de recomendaciones domiciliarias para personas mayores.",
        lang: "es-CL",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "any",
        theme_color: "#0F766E",
        background_color: "#F1F5F9",
        categories: ["health", "medical", "lifestyle"],
        icons: [
          {
            src: "icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icons/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache completo del App Shell (HTML, JS, CSS, SVG, iconos PNG)
        // vite-plugin-pwa agrega manifest.webmanifest automáticamente sin duplicarlo
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Recursos estáticos locales (planos SVG, imágenes, iconos) con CacheFirst
            urlPattern: ({ request }) =>
              request.destination === "image" ||
              request.destination === "font" ||
              request.destination === "style",
            handler: "CacheFirst",
            options: {
              cacheName: "hogar-seguro-static-v1",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Lecturas GET de Supabase (perfil, peligros, recomendaciones) con NetworkFirst y respaldo caché
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              url.hostname.endsWith("supabase.co") &&
              url.pathname.startsWith("/rest/v1/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "hogar-seguro-supabase-read-v1",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
