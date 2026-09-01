import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  // Next.js sets "jsx": "preserve" in tsconfig, which the test transformer
  // would otherwise inherit; tests import .tsx (the newsletter email), so
  // transform JSX here.
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
});
