import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "favicon.ico", "pwa-icon.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "gstatic-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      manifest: {
        name: "AtivaRH - Sistema de Gestão de RH",
        short_name: "AtivaRH",
        description: "Sistema completo de gestão de recursos humanos com controle de ponto, holerites e muito mais.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["business", "productivity"],
        icons: [
          { src: "/pwa-icon.png", sizes: "72x72", type: "image/png", purpose: "any" },
          { src: "/pwa-icon.png", sizes: "96x96", type: "image/png", purpose: "any" },
          { src: "/pwa-icon.png", sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/pwa-icon.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/pwa-icon.png", sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/pwa-icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-icon.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/pwa-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
