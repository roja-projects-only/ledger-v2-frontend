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
        manualChunks: {
          // React core + routing
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // TanStack Query
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          
          // Radix UI components (large bundle)
          'ui-vendor': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-visually-hidden',
          ],
          
          // Charts library (heavy)
          'chart-vendor': ['recharts'],
          
          // Utilities and icons
          'utils-vendor': [
            'axios',
            'date-fns',
            'lucide-react',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
          ],
        },
      },
    },
  },
})