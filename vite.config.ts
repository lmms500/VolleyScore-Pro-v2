import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // INCLUI TODOS OS ASSETS DEDICADOS (PNG, ICO, SVG)
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'icon.svg'], 
      devOptions: {
        enabled: true
      },
      workbox: {
        // Assegura que ICO e PNG sejam incluídos no cache
        globPatterns: ['**/*.{js,css,html,svg,json,ico,png}'], 
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'VolleyScore Pro 2',
        short_name: 'VolleyScore',
        description: 'Professional Volleyball Scoreboard & Team Manager',
        id: '/', 
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        categories: ['sports', 'utilities'],
        icons: [
          // 1. SVG (Flexibilidade)
          {
            src: 'icon.svg',
            sizes: '192x192 512x512', 
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          // 2. PNG PWA 192x192 (Padrão Android)
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          // 3. PNG PWA 512x512 (Alta Resolução)
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
        ]
      }
    })
  ],
});