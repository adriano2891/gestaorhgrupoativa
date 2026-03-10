import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear stale Service Worker API caches on boot
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      if (name.includes('api-cache')) {
        caches.delete(name);
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
