// Separate build config used ONLY to produce a static, fully client-side SPA
// bundle for the Capacitor (native Android) app. Does not touch the Lovable
// SSR build (vite.config.ts). Run with:
//   vite build --config vite.config.capacitor.ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // No server output — we want static assets bundled into the APK.
  nitro: false,
  tanstackStart: {
    // Client-only SPA: emit a static shell index.html that boots the app.
    spa: { enabled: true },
  },
});
