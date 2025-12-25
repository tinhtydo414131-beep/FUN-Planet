import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    commonjsOptions: {
      // Only transform actual CommonJS deps; avoid forcing CJS transform on ESM-only packages like wagmi
      include: [/node_modules/],
      exclude: [
        'wagmi',
        'viem',
        '@reown/appkit',
        '@reown/appkit-adapter-wagmi',
        '@walletconnect/ethereum-provider',
      ],
      transformMixedEsModules: false,
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "use client" warnings from wagmi/viem
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        warn(warning);
      },
    },
  },
  optimizeDeps: {
    include: [
      // Include all web3 packages and their dependencies for proper ESM handling
      'wagmi',
      'viem',
      '@tanstack/react-query',
      '@reown/appkit',
      '@reown/appkit-adapter-wagmi',
      '@walletconnect/ethereum-provider',
      'eventemitter3',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
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
        globPatterns: ["**/*.{css,html,ico,png,svg,jpg,jpeg,webp}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Exclude JS files from precaching - fetch at runtime
        globIgnores: ['**/*.js'],
        runtimeCaching: [
          {
            urlPattern: /\.js$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "js-runtime-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
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
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
