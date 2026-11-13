import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'EMBER Milano — Fire-grilled burgers',
        short_name: 'EMBER',
        description: 'Fire-grilled burgers, crispy chicken and Neapolitan pizza, delivered in 30 minutes across Milan.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0f0c0a',
        background_color: '#0f0c0a',
        categories: ['food', 'shopping', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Menu', short_name: 'Menu', url: './#menu', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Today’s deal', short_name: 'Deals', url: './#offer', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // app shell is precached; photos are cached as you browse
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'icons/*.png', 'img/hero-burger*'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/img/'),
            handler: 'CacheFirst',
            options: { cacheName: 'ember-images', expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
})
