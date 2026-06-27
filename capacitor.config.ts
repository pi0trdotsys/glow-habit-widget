import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.glow_habit_widget",
  appName: "Loop",
  // Static, client-only SPA build produced by `bun run build:cap`.
  webDir: "dist/client",
  android: {
    // Allow http://localhost asset serving (default) and keep it self-contained.
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1400,
      launchAutoHide: true,
      backgroundColor: "#0b0d11",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
