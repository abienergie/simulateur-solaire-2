import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Simulateur Solaire',
        short_name: 'Simulateur',
        description: 'Votre simulateur solaire intelligent',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: './favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: './logo-simulateur.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      // Désactiver complètement le service worker
      disable: true,
      devOptions: {
        enabled: false
      }
    })
  ],
  base: './', // Utiliser des chemins relatifs
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          pdf: ['jspdf', 'jspdf-autotable', 'pdf-lib']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    hmr: true
  },
  envPrefix: 'VITE_'
});