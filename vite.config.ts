import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        strategies: "injectManifest",
        srcDir: "src/pwa",
        filename: "sw.ts",
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
        pwaAssets: {
          config: true,
          includeHtmlHeadLinks: false,
          overrideManifestIcons: true,
        },
        manifest: {
          name: "Water Refilling Ledger",
          short_name: "Ledger",
          description: "PWA for managing daily water refilling sales and balances.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          display_override: ["standalone", "browser"],
          background_color: "#0f172a",
          theme_color: "#0f172a",
          categories: ["business", "productivity"],
          orientation: "portrait-primary",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-512x512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        useCredentials: true,
        devOptions: {
          enabled: mode === "development",
          suppressWarnings: true,
          navigateFallback: "index.html",
        },
        includeAssets: ["mask-icon.svg"],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})