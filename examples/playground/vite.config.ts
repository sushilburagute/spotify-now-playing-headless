import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(import.meta.dirname, 'vite'),
  base: '/react/',
  plugins: [react()],
  build: {
    outDir: resolve(import.meta.dirname, 'public/react'),
    emptyOutDir: true,
  },
})
