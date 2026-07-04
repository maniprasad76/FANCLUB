import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: { polyfill: false },
    // Target modern browsers for smaller output
    target: 'es2020',
    // No sourcemaps in production
    sourcemap: false,
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
  },
})

