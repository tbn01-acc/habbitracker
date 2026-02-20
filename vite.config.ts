import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Базовый путь должен быть '/' для корректной работы маршрутизации на Vercel
  base: '/',

  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/db': {
        target: 'https://jexrtsyokhegjxnvqjur.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/db/, ''),
        secure: true,
      },
    },
  },
  
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Плагин для PWA (настройки берем из вашего текущего стека)
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Top Focus',
        short_name: 'TopFocus',
        theme_color: '#ffffff',
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
          }
        ]
      }
    })
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 1500,
    
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React и связанные пакеты ВМЕСТЕ в одном чанке
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          // Radix UI компоненты
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query';
          }
          // Supabase
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          // Тяжёлые графики
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // Анимации
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          // Lucide icons
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          // date-fns
          if (id.includes('node_modules/date-fns/')) {
            return 'vendor-date';
          }
          // Все остальные node_modules — в общий чанк (не даём Rollup создавать произвольные чанки)
          if (id.includes('node_modules/')) {
            return 'vendor-others';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
}));
