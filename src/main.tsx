import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Configure QueryClient with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const initTelegramWebApp = () => {
  try {
    const tg = (window as any)?.Telegram?.WebApp;
    if (tg) {
      tg.ready?.();
      tg.expand?.();

      // Apply Telegram theme early (Telegram can open in light mode)
      if (tg.colorScheme === "light") {
        document.documentElement.classList.remove("dark");
      }
      return;
    }

    // If we're inside Telegram but SDK is not present yet, load it without blocking the app.
    const ua = navigator.userAgent || "";
    const looksLikeTelegram = /Telegram/i.test(ua);
    if (!looksLikeTelegram) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      const tgAfterLoad = (window as any)?.Telegram?.WebApp;
      tgAfterLoad?.ready?.();
      tgAfterLoad?.expand?.();
      if (tgAfterLoad?.colorScheme === "light") {
        document.documentElement.classList.remove("dark");
      }
    };
    script.onerror = () => {
      // Fail silently: the app must still load in any WebView.
      console.warn("Telegram WebApp SDK failed to load");
    };
    document.head.appendChild(script);
  } catch (e) {
    console.warn("Telegram WebApp init error", e);
  }
};

initTelegramWebApp();

// Register service worker for push notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw-notifications.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
