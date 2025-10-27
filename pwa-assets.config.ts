import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0.08,
    },
    apple: {
      sizes: [180],
      padding: 0.12,
    },
    transparent: {
      sizes: [512, 192],
    },
  },
  images: ["public/pwa-icon.svg"],
});
