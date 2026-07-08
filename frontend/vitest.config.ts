import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.client': 'true',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['app/**/*.test.ts', 'app/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['app/utils/**', 'app/composables/**'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '@': resolve(__dirname, './app'),
      '@ts-rest/core': resolve(__dirname, './app/__tests__/mocks/ts-rest-core.ts'),
      '@medicote/shared': resolve(__dirname, './app/__tests__/mocks/medicote-shared.ts'),
    },
  },
})
