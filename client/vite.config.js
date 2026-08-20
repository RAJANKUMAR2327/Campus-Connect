import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'CampusConnect',
        short_name: 'CampusConnect',
        description: 'Your college community platform',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // IMAGE-SIZE FIX FOLLOW-UP: the three decorative Login/Register
        // background images that used to be 2–9 MB PNGs (see git history
        // and client/src/pages/Login.jsx / Register.jsx) have since been
        // resized and converted to WebP (largest is now ~390 KB) — the
        // original hard build failure this config once had to explicitly
        // work around (workbox's 2 MiB default per-file precache limit)
        // no longer applies to them at all.
        //
        // `webp` is deliberately left out of globPatterns below, so those
        // three files — and the two other decorative page-specific PNGs
        // in src/assets that were already under the size limit — still
        // aren't precached. That's not a size workaround anymore, it's
        // the right call regardless of size: Login/Register need network
        // access to actually function, so precaching their background art
        // buys no real offline capability, only a bigger install payload
        // for every visitor. If genuinely core, precache-worthy images
        // are ever added in WebP format, add `webp` here and exclude the
        // decorative ones by name instead of leaving the whole format out.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        importScripts: ['sw-push.js'], // import our push handler
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/campus-connect-api-l4xm\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 100, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
})