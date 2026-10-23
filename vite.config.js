import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' para funcionar em qualquer pasta (GitHub Pages, Netlify, etc.)
export default defineConfig({
  base: './',
  plugins: [vue()],
})
