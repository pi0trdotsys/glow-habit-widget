import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.glow_habit_widget",
  appName: "Loop",
  // Static, client-only SPA build produced by `bun run build:cap`.
  webDir: "dist/client",
  android: {
    // Allow http://localhost asset serving (default) and keep it self-contained.
  },
};

export default config;
