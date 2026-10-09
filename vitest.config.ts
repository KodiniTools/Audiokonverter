import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Eigene Konfiguration, damit vite.config.ts (Build, PWA) unverändert bleibt.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // jsdom: der Theme-Store arbeitet auf document/localStorage
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts'],
    restoreMocks: true,
  },
})
