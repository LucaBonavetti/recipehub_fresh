import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxy: send API & uploads to Nest (http://localhost:3001)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
