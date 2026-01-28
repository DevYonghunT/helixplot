import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    base: "./",
    plugins: [
        react(),
        tailwindcss(),
        wasm(),
        topLevelAwait(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: false, // Use existing manifest.webmanifest in public/
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,wasm}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                ],
            },
        }),
    ],
    build: {
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: {
                    math: ['mathjs', 'mathlive'],
                    three: ['three', '@react-three/fiber', '@react-three/drei']
                }
            }
        }
    }
});
