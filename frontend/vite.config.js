import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Used only for `npm run dev` outside Docker. In the container the
    // production build is served by nginx, which proxies /api itself.
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true }
    }
  },
  build: { outDir: 'dist', sourcemap: false }
});
