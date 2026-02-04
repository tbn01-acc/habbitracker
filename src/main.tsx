import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Расширяем интерфейс Window для работы с Telegram SDK
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

// Конфигурация QueryClient с оптимальными настройками для мобильных сетей
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 минуты
      gcTime: 1000 * 60 * 10, // 10 минут
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Инициализация Telegram Mini App
 */
const initTelegram = () => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    
    // Синхронизация темной/светлой темы с системной темой Telegram
    if (tg.colorScheme === "dark" || !tg.colorScheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    console.log("Telegram WebApp SDK инициализирован успешно");
  } else {
    console.warn("Telegram WebApp SDK не найден. Приложение запущено в обычном браузере.");
  }
};

// Запускаем инициализацию немедленно
initTelegram();

/**
 * Регистрация Service Worker для PWA и уведомлений
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw-notifications.js")
      .then((reg) => console.log("Service Worker зарегистрирован:", reg.scope))
      .catch((err) => console.error("Ошибка регистрации Service Worker:", err));
  });
}

/**
 * Рендеринг приложения с обработкой критических ошибок
 */
const container = document.getElementById("root");

if (!container) {
  throw new Error("Не удалось найти элемент #root. Проверьте ваш index.html.");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
