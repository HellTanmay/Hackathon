import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    optimizeDeps: {
    include: ["react", "react-dom", "react-router", "react-router-dom"]
  },
  plugins: [react(),
    tailwindcss()
  ],
})
