import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import path from 'path';

// Custom Vite plugin to watch public/beats/ folder and auto-generate manifest on file drop
const watchBeatsPlugin = () => ({
  name: 'watch-beats-plugin',
  configureServer(server: any) {
    const beatsDir = path.resolve(__dirname, 'public/beats');
    server.watcher.add(beatsDir);
    server.watcher.on('add', (filePath: string) => {
      if (filePath.includes('beats') && !filePath.includes('covers')) {
        console.log('🎵 [Vite Watcher] New beat uploaded to /public/beats/. Regenerating manifest & cover art...');
        try {
          execSync('node generate-manifest.js');
        } catch (err) {
          console.error('Error running generate-manifest:', err);
        }
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    watchBeatsPlugin(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'DZVNbeats | Studio Beat Portfolio',
        short_name: 'DZVNbeats',
        description: 'Serverless Studio Beat Portfolio & Direct Licensing Platform',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // EXPLICIT REQUIREMENT: Ignore /public/beats/ to prevent heavy audio caching & mobile quota crashes
        globIgnores: ['**/beats/**', 'beats/**'],
        navigateFallbackDenylist: [/^\/beats/]
      }
    })
  ],
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  server: {
    port: 3000,
    open: true
  }
});
