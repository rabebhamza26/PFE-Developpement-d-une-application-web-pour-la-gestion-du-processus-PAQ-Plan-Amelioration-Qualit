import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: 'globalThis'
  },
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      "/api": {
        target: "http://localhost:8083",
        changeOrigin: true
      }
    }
  }
})

