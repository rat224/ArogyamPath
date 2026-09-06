import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-192x192-maskable.png',
        'pwa-512x512.png',
        'pwa-512x512-maskable.png',
      ],

      manifest: {
        name: 'ArogyamPath',
        short_name: 'ArogyamPath',
        description: 'AI-Assisted Patient-Doctor Healthcare Platform',
        theme_color: '#059669',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable', 
          },
        ],
        screenshots: [
          {
            src: '/desktop_pwa.png',
            sizes: '1883x895',
            type: 'image/png',
            form_factor: 'wide',
            label: 'ArogyamPath Desktop Dashboard'
          },
          {
            src: '/mobile_pwa.png',
            sizes: '871x1600',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'ArogyamPath Mobile Interface'
          }
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-firestore-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, 
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, 
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, 
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})

