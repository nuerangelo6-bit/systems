import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'https://systems-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})
