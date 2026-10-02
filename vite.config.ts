import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue({
      template: {
        transformAssetUrls: {
          // public/ images are served from the root at runtime — no need to
          // rewrite them into imports, which breaks under Vitest.
          img: [],
        },
      },
    }),
    tailwindcss(),
    // Skip the devtools overlay during e2e — it intercepts pointer events in Firefox
    mode !== 'e2e' && vueDevTools(),
  ],
  server: {
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
