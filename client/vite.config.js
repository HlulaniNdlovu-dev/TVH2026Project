import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host: true lets phones on the same Wi-Fi open the app during the demo.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 5173 },
});
