import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.loomledger.mobile",
  appName: "Loom Ledger",
  // TanStack Start / Nitro emits the built static assets to .output/public.
  // Capacitor copies from this folder into the Android project on `cap sync`.
  webDir: ".output/public",
};

export default config;
