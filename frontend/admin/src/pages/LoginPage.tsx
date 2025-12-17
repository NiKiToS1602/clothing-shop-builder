import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAccessToken } from "../features/auth/authSlice";
import { apiFetch } from "../shared/api/client";

const COOLDOWN_SECONDS = 30;

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("test@example.com");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string>("");

  const [cooldownLeft, setCooldownLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  function startCooldown(seconds: number) {
    setCooldownLeft(seconds);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = window.setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  async function handleLogin() {
    if (cooldownLeft > 0) return;

    setStatus("Отправляем код...");

    try {
      const res = await apiFetch("/api/v1/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email })
      });

      if (res.status === 429) {
        setStatus("Слишком часто. Попробуйте через 30 секунд.");
        startCooldown(COOLDOWN_SECONDS);
        return;
      }

      if (!res.ok) {
        setStatus("Ошибка отправки кода");
        return;
      }

      setStatus("Код отправлен. Проверь почту.");
      startCooldown(COOLDOWN_SECONDS);
    } catch {
      setStatus("Ошибка сети или API");
    }
  }

  async function handleConfirm() {
    setStatus("Подтверждаем код...");

    try {
      const res = await apiFetch("/api/v1/auth/confirm/", {
        method: "POST",
        body: JSON.stringify({ email, code })
      });

      if (res.status === 429) {
        setStatus("Слишком много попыток. Попробуйте позже.");
        return;
      }

      if (!res.ok) {
        setStatus("Неверный или просроченный код");
        return;
      }

      const data = await res.json();
      dispatch(setAccessToken(data.access_token));
      navigate("/");
    } catch {
      setStatus("Ошибка сети или API");
    }
  }

  const loginBtnText =
    cooldownLeft > 0 ? `Получить код (${cooldownLeft}s)` : "Получить код";

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>

      <div>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <button onClick={handleLogin} disabled={cooldownLeft > 0}>
        {loginBtnText}
      </button>

      <div>
        <label>Код</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} />
      </div>

      <button onClick={handleConfirm}>Войти</button>

      <p>{status}</p>
    </div>
  );
}
