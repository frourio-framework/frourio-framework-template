/// <reference types="vitest" />
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

dotenv.config();

export default defineConfig({
  define: { 'import.meta.vitest': false },
  plugins: [tsconfigPaths()],

  test: {
    globals: true,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
    },
    setupFiles: ['@frouvel/kaname/testing/setup.ts'],
    includeSource: ['**/*.ts'],
    hookTimeout: 100000,
    testTimeout: 10000,
  },
});
