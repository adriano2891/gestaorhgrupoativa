import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  logLevel: "warn",
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 1500,
    reportCompressedSize: false,
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      useCredentials: true,
      devOptions: {
        enabled: true,
        type: "module",
      },
      includeAssets: [
        "favicon.png",
        "favicon.ico",
        "pwa-icon.png",
        "apple-touch-icon.png",
        "pwa-72x72.png",
        "pwa-96x96.png",
        "pwa-128x128.png",
        "pwa-144x144.png",
        "pwa-152x152.png",
        "pwa-192x192.png",
        "pwa-384x384.png",
        "pwa-512x512.png",
      ],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
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
          {
            urlPattern: /\/rest\/v1\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\/auth\/v1\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
      manifest: {
        name: "AtivaRH - Sistema de Gestão de RH",
        short_name: "AtivaRH",
        description: "Sistema completo de gestão de recursos humanos com controle de ponto, holerites e muito mais.",
        id: "/",
        lang: "pt-BR",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/login",
        scope: "/",
        categories: ["business", "productivity"],
        icons: [
          { src: "/pwa-72x72.png", sizes: "72x72", type: "image/png", purpose: "any" },
          { src: "/pwa-96x96.png", sizes: "96x96", type: "image/png", purpose: "any" },
          { src: "/pwa-128x128.png", sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/pwa-144x144.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/pwa-152x152.png", sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-384x384.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
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
