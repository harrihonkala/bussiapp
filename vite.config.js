import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Muuta 'bussiapp' vastaamaan GitHub-repositoriosi nimeä
export default defineConfig({
  plugins: [react()],
  base: '/bussiapp/',
})
