import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCodeProtection } from "./utils/codeProtection";

// Активация защиты кода в production
initCodeProtection();

// Расширяем интерфейс Window для работы с Telegram SDK
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

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
    <App />
  </React.StrictMode>
);
