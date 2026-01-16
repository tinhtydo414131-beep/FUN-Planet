import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
    dedupe: ["wagmi", "viem", "@wagmi/core", "@tanstack/react-query"],
  },
  build: {
    target: "esnext",
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "use client" warnings from wagmi/viem
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        warn(warning);
      },
      output: {
        // Add content hash to filenames for cache busting
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
  },
  optimizeDeps: {
    include: ["wagmi", "viem", "@wagmi/core"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  ssr: {
    noExternal: ["wagmi", "viem"],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Only enable PWA in production to avoid build conflicts with wagmi
    mode === "production" && VitePWA({
      registerType: "autoUpdate",
      injectRegister: 'auto',
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "FUN Planet - Build Your Planet",
        short_name: "FUN Planet",
        description: "Build Your Planet – Play & Earn Joy! Create your dream world with amazing games and earn rewards!",
        theme_color: "#8B46FF",
        background_color: "#0F172A",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        // Chỉ cache static assets, KHÔNG cache HTML
        globPatterns: ["**/*.{css,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Exclude ALL JS, MJS, and HTML files from precaching
        globIgnores: ['**/*.js', '**/*.mjs', '**/*.html', 'index.html'],
        // Force new SW to take over immediately
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Disable navigateFallback to prevent HTML caching
        navigateFallback: null,
        runtimeCaching: [
          {
            // NEVER cache HTML files - always fetch fresh
            urlPattern: /\.html$/i,
            handler: "NetworkOnly",
          },
          {
            // NEVER cache navigation requests (SPA routes) - always fetch fresh
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: "NetworkFirst",
            options: {
              networkTimeoutSeconds: 3,
              cacheName: "navigation-cache",
            }
          },
          {
            // NEVER cache JS files - always fetch from network
            urlPattern: /\.(?:js|mjs)$/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "js-no-cache"
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-cache"
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
}));
