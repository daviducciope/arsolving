import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://daviducciope.github.io',
  base: '/arsolving',
  vite: {
    plugins: [tailwindcss()],
  },
})
