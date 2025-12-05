
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Mudado para 'prompt' para controlar a atualização
      injectRegister: null, // Desabilita injeção automática (faremos manualmente no componente)
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'], 
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,ico,png}'], 
        cleanupOutdatedCaches: true,
        clientsClaim: true, 
        skipWaiting: false, // Importante: FALSE para permitir que o usuário escolha quando atualizar
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
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '/',
        categories: ['sports', 'utilities'],
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512', 
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
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
  build: {
    minify: 'esbuild', 
    sourcemap: false, 
  }
});
