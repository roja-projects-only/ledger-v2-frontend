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
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@tanstack')) return 'vendor-query';
            if (id.includes('lucide-react') || id.includes('@radix-ui')) return 'vendor-ui';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('axios') || id.includes('zod') || id.includes('date-fns')) return 'vendor-utils';
            return 'vendor-other';
          }
          // App chunks
          if (id.includes('/pages/')) return 'pages';
          if (id.includes('/components/')) return 'components';
        },
      },
    },
    chunkSizeWarningLimit: 800, // Increase warning threshold to 800kB
  },
})