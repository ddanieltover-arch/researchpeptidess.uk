import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { defineConfig } from 'vite';
import { adminApiPlugin } from './src/server/vite-admin-api-plugin';

loadEnv();

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), adminApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
