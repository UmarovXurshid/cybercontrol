import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev uchun: VITE_API_URL=http://localhost:8001 npm run dev
// Docker ichida nginx.conf proxy ishlatiladi (vite ishlatilmaydi)
const apiTarget = process.env.VITE_API_URL || 'http://localhost:8001'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/media': {
        target: apiTarget,
        changeOrigin: true,
      },
    }
  }
})
