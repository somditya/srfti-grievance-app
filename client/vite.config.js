import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxy_req_error', (err, req, res) => {
            console.log('proxy_req_error', err);
          });
        }
      },
      '/uploads': {
        target: 'http://backend:5000',
        changeOrigin: true
      }
    }
  }
});
