import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // PWA: service worker + app-shell precache + installability.
    // The web manifest stays in public/manifest.json (manifest: false) so the
    // existing <link rel="manifest"> in index.html keeps working untouched.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: [
        'favicon.svg',
        'favicon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'manifest.json',
        'robots.txt',
      ],
      workbox: {
        // Cache the whole app shell (hashed JS/CSS, HTML, fonts, icons)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // SPA navigation fallback: any same-origin navigation loads the shell
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Product images live in Supabase Storage — cache them for offline.
        // StaleWhileRevalidate (not CacheFirst) so admins' photo swaps still
        // reach returning users quickly instead of serving stale art for a month.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'fan-image-storage',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'fan-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    modulePreload: { polyfill: false },
    // Target modern browsers for smaller output
    target: 'es2020',
    // No sourcemaps in production
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    // Chunk splitting for better caching
    rolldownOptions: {
      output: {
        // Separate vendor chunks so they cache independently from app code
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // React core — never changes, longest cache
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // Router — changes rarely
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Animation libs — large, separate chunk
            if (id.includes('framer-motion')) {
              return 'vendor-animations';
            }
            // Supabase client
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // UI utilities
            if (id.includes('react-hot-toast') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            // Data layer
            if (id.includes('axios')) {
              return 'vendor-data';
            }
            // All other node_modules
            return 'vendor-misc';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
})

