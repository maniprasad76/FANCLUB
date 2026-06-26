import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: { polyfill: false },
    // Target modern browsers for smaller output
    target: 'es2020',
    // Chunk splitting for better caching
    rolldownOptions: {
      output: {
        // Separate vendor chunks so they cache independently from app code
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer';
            }
            if (id.includes('react-hot-toast') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('axios')) {
              return 'data';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
  },
})
