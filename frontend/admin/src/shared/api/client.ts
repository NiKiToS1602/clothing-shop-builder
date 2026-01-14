import { getToken, saveToken, clearToken } from "../auth/tokenStorage";

const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL;
const CATALOG_BASE = import.meta.env.VITE_CATALOG_API_URL;

if (!AUTH_BASE) throw new Error("VITE_AUTH_API_URL is not defined");
if (!CATALOG_BASE) throw new Error("VITE_CATALOG_API_URL is not defined");

// какие эндпоинты не требуют Authorization
function isPublic(path: string) {
  return (
    path.startsWith("/api/v1/auth/login/") ||
    path.startsWith("/api/v1/auth/confirm/") ||
    path.startsWith("/api/v1/auth/refresh/")
  );
}

// в какой сервис идти
function pickBaseUrl(path: string) {
  // всё auth — в auth сервис
  if (path.startsWith("/api/v1/auth/")) return AUTH_BASE;
  // всё остальное — в catalog сервис (для админки этого достаточно)
  return CATALOG_BASE;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_BASE}/api/v1/auth/refresh/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) return null;

    saveToken(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const baseUrl = pickBaseUrl(path);
  const publicReq = isPublic(path);

  const makeHeaders = (token?: string) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    };

    // если тело JSON — ставим content-type (но не ломаем FormData)
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    }

    if (!publicReq && token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  const doFetch = (token?: string) =>
    fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers: makeHeaders(token),
    });

  // 1) первая попытка
  let token = getToken();
  let res: Response;

  try {
    res = await doFetch(token ?? undefined);
  } catch (e) {
    throw new Error(`Failed to fetch: ${path}`);
  }

  // 2) если 401 — пробуем refresh и повторяем
  if (res.status === 401 && !publicReq) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      clearToken();
      return res; // дальше страница покажет ошибку/редирект на логин
    }
    res = await doFetch(newToken);
  }

  return res;
}
