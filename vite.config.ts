import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // Базовый путь должен быть '/' для корректной работы маршрутизации на Vercel
  base: '/',
  
  plugins: [
    react(),
    // Плагин для PWA (настройки берем из вашего текущего стека)
    VitePWA({
      registerType: 'autoUpdate',
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
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Увеличиваем лимит предупреждения, но стремимся к уменьшению через чанки
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Стратегия разделения кода на логические блоки
        manualChunks(id) {
          // Выносим ядро React в отдельный файл
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Выносим тяжелые графики (Recharts)
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          // Библиотеки UI (Radix, Lucide)
          if (id.includes('node_modules/@radix-ui') || id.includes('lucide-react')) {
            return 'vendor-ui';
          }
          // TanStack Query и Persister
          if (id.includes('node_modules/@tanstack')) {
            return 'vendor-query';
          }
          // Анимации (Framer Motion)
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Всё остальное из node_modules уходит в общий vendor
          if (id.includes('node_modules')) {
            return 'vendor-others';
          }
        },
        // Гарантируем понятные имена файлов для отладки
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    // Оптимизация для продакшена
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Убираем console.log для чистоты и веса
        drop_debugger: true,
      },
    },
  },
});
