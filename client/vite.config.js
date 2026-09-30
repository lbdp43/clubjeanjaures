import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' : la nouvelle version n'écrase pas l'app ouverte (sinon les pages
      // chargées à la demande pointent vers des fichiers supprimés → écran d'erreur).
      // L'utilisateur voit une bannière "Nouvelle version" et choisit quand recharger.
      registerType: 'prompt',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Club Jean Jaurès',
        short_name: 'Jean Jaurès',
        description: "Club d'affaires de Saint-Étienne",
        theme_color: '#16324f',
        background_color: '#16324f',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        importScripts: ['push-sw.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/verify/, /^\/auth\/verify/],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [
          {
            // Images uploadées = immuables (UUID), cache agressif
            urlPattern: /^https?:\/\/.*\/api\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 }
            }
          },
          {
            // Auth = jamais en cache (sinon on reste "connecté" hors-ligne après déconnexion)
            urlPattern: /^https?:\/\/.*\/api\/auth\//,
            handler: 'NetworkOnly'
          },
          {
            // Toutes les autres requêtes API = réseau d'abord, cache en fallback offline
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-network-first',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              networkTimeoutSeconds: 8
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
});
