import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // forward all /api/* requests to Nest (port 3001)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // serve uploaded images from the API too
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
