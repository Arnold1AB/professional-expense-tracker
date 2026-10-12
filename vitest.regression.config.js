import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Runs only the targeted regression tests in tests/regression (`npm run test:bug`).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    include: ['tests/regression/**/*.test.{js,jsx}'],
  },
});
