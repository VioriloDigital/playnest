import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "gr.playnest.app",
  appName: "PlayNest",
  webDir: "dist",
  backgroundColor: "#fffaf6",
  android: { backgroundColor: "#fffaf6" },
  server: { androidScheme: "https" },
}

export default config
