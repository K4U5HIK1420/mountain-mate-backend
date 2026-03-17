import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          router: ["react-router-dom"],
          motion: ["framer-motion"],
          maps: ["leaflet", "react-leaflet", "leaflet-defaulticon-compatibility"],
          realtime: ["socket.io-client"],
          supabase: ["@supabase/supabase-js"],
          http: ["axios"],
          icons: ["lucide-react"],
        },
      },
    },
  },
})
