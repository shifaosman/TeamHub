/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@teamhub/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  server: {
    port: 5173,
    host: true, // Allow access from mobile/network devices
    proxy: {
      '/api': {
        target: 'http://localhost:2000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:2000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxy
      },
    },
  },
});
