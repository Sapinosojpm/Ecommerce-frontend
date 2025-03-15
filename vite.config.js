import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/uploads": {
        target: "http://localhost:4000", // Your backend server
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:4000", // Ensure API calls also pass correctly
        changeOrigin: true,
      },
    },
  },
})
