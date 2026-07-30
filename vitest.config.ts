import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'e2e'],
    // Force Vite to bundle ESM-only deps that jsdom's CJS chain can't require()
    server: {
      deps: {
        inline: ['@exodus/bytes'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Stub Next.js modules that aren't available in the Vitest/jsdom environment
      'next/link': path.resolve(__dirname, 'src/test/mocks/next-link.tsx'),
      'next/navigation': path.resolve(__dirname, 'src/test/mocks/next-navigation.ts'),
      'next/image': path.resolve(__dirname, 'src/test/mocks/next-image.tsx'),
    },
  },
});
