import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/uploads": {
        target: "https://ecommerce-server-d8a1.onrender.com", // Your backend server
        changeOrigin: true,
      },
      "/api": {
        target: "https://ecommerce-server-d8a1.onrender.com", // Ensure API calls also pass correctly
        changeOrigin: true,
      },
    },
  },
})
