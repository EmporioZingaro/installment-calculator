import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Calculadora de Parcelamento',
        short_name: 'Parcelas',
        icons: [
          { src: './logo.svg', sizes: '192x192', type: 'image/svg+xml' }
        ],
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f5f7',
        theme_color: '#0066c0'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}'],
        cleanupOutdatedCaches: true
      }
    })
  ],

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        settings: resolve(__dirname, 'settings.html')
      }
    }
  }
});
