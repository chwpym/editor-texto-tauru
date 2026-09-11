import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    exclude: ['./tests/e2e/**', './node_modules/**'],
  },
});
