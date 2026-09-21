import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host: true lets phones on the same Wi-Fi open the app during the demo.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Heavy libraries get their own files so they are cached and only fetched by the pages that need them.
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], charts: ['recharts'], maps: ['leaflet', 'react-leaflet'] },
      },
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 5173 },
});
