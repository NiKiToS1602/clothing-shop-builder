import { useState } from "react";
import { useDispatch } from "react-redux";
import { setAccessToken } from "../features/auth/authSlice";

export function LoginPage() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("test@example.com");
  const [code, setCode] = useState("123456");
  const [status, setStatus] = useState<string>("");

  async function handleLogin() {
    setStatus("Отправляем код...");
    const res = await fetch("http://localhost:8001/api/v1/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    setStatus(res.ok ? "Код отправлен (dev режим)." : "Ошибка отправки кода.");
  }

  async function handleConfirm() {
    setStatus("Подтверждаем...");
    const res = await fetch("http://localhost:8001/api/v1/auth/confirm/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, code })
    });

    if (!res.ok) {
      setStatus("Неверный код.");
      return;
    }

    const data = await res.json();
    dispatch(setAccessToken(data.access_token));
    setStatus("Успешный вход.");
  }

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", fontFamily: "system-ui" }}>
      <h1>Admin Login</h1>

      <label style={{ display: "block", marginTop: 16 }}>
        Email
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <button style={{ marginTop: 12, padding: 10, width: "100%" }} onClick={handleLogin}>
        Получить код
      </button>

      <label style={{ display: "block", marginTop: 16 }}>
        Код
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>

      <button style={{ marginTop: 12, padding: 10, width: "100%" }} onClick={handleConfirm}>
        Подтвердить
      </button>

      <p style={{ marginTop: 16 }}>{status}</p>
    </div>
  );
}
