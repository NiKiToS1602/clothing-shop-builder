import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAccessToken } from "../features/auth/authSlice";

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

    setStatus(res.ok ? "Код отправлен." : "Ошибка отправки кода.");
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

    // 🔑 редирект после успешного логина
    navigate("/");

    setStatus("Успешный вход.");
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Login</h1>

      <div>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button onClick={handleLogin}>Получить код</button>

      <div>
        <label>Код</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <button onClick={handleConfirm}>Войти</button>

      <p>{status}</p>
    </div>
  );
}
