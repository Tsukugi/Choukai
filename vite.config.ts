import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});