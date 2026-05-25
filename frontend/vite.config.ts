import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: false,
  },
  server: {
    port: 5173,
  },
})
