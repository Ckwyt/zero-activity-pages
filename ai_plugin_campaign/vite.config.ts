import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'online' ? './' : undefined,
  server: {
    port: 4175,
  },
  preview: {
    port: 4175,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  test: {
    environment: 'jsdom',
    css: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
}));
