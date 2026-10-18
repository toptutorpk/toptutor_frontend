import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    // Allow tunnel hosts. A leading dot matches every subdomain, which matters for Cloudflare quick
    // tunnels: each run gets a new random name (e.g. districts-iron-bidder-vehicles.trycloudflare.com).
    // ngrok: *.ngrok-free.dev / *.ngrok-free.app / *.ngrok.io · Cloudflare: *.trycloudflare.com
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io', '.trycloudflare.com'],
    // Same-origin proxy to the backend. The browser only ever talks to the
    // page origin (localhost or the tunnel), so there is no CORS and no
    // https→http mixed-content block, and it works from any device.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query', 'axios'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
