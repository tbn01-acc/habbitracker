import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const App = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [details, setDetails] = useState<string>("Инициализация...");
  const [proxyUrl, setProxyUrl] = useState<string>("");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // URL прокси формируется динамически
        const proxyUrl = `${window.location.origin}/api/db`;
        setProxyUrl(proxyUrl);

        // Делаем тестовый запрос к прокси
        const { data, error } = await supabase
          .from("profiles")
          .select("count", { count: "exact", head: true });

        if (error) throw error;

        setStatus("success");
        setDetails("Связь с Supabase через прокси установлена успешно!");
      } catch (err: any) {
        console.error("Ошибка проверки связи:", err);
        setStatus("error");
        setDetails(err.message || "Неизвестная ошибка сети");
      }
    };

    checkConnection();
  }, []);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#0f172a",
      color: "white",
      fontFamily: "sans-serif"
    }}>
      <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>Тест соединения</h1>
      
      <div style={{
        padding: "15px",
        borderRadius: "8px",
        backgroundColor: status === "loading" ? "#334155" : status === "success" ? "#065f46" : "#7f1d1d",
        marginBottom: "20px"
      }}>
        {details}
      </div>

      <div style={{ fontSize: "12px", opacity: 0.6 }}>
        <p>Используемый URL: <strong>{proxyUrl}</strong></p>
        <p>Текущее время: {new Date().toLocaleTimeString()}</p>
      </div>

      {status === "error" && (
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            border: "none",
            borderRadius: "5px",
            color: "white",
            cursor: "pointer"
          }}
        >
          Повторить попытку
        </button>
      )}
    </div>
  );
};

export default App;
