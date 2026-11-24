import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "gr.playnest.app",
  appName: "PlayNest",
  webDir: "dist",
  backgroundColor: "#fffaf6",
  android: { backgroundColor: "#fffaf6" },
  server: { androidScheme: "https" },
  plugins: {
    // Dark status/navigation bar icons on the app's light background; insets reach CSS as --safe-area-inset-*.
    SystemBars: { style: "LIGHT", insetsHandling: "css" },
  },
}

export default config
