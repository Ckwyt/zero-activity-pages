import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'online' || mode === 'github' ? './' : undefined,
  server: {
    port: 4175,
    proxy: {
      '/api/ai-products': {
        target: 'https://cloud.zbrowser.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai-products/, '/v1/ai/products'),
      },
    },
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
