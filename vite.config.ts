import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split heavy vendor libraries
          if (id.includes("node_modules/recharts")) {
            return "charts";
          }
          if (id.includes("node_modules/react-router-dom")) {
            return "router";
          }
          if (id.includes("node_modules/date-fns")) {
            return "date-utils";
          }
          if (
            id.includes("node_modules/@tanstack/react-query") ||
            id.includes("node_modules/@tanstack/react-virtual")
          ) {
            return "react-query";
          }
          if (
            id.includes("node_modules/@radix-ui/") ||
            id.includes("node_modules/lucide-react")
          ) {
            return "ui-vendor";
          }
          if (
            id.includes("components/shared/PaymentRecordingModal") ||
            id.includes("components/shared/CustomerDebtHistoryModal")
          ) {
            return "payment-modals";
          }
          if (id.includes("node_modules/next-themes")) {
            return "themes";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase warning threshold to 600 kB
  },
})