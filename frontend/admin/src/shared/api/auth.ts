import { apiFetch } from "./client";

export async function refreshAccessToken() {
  const res = await apiFetch("/api/v1/auth/refresh/", { method: "POST" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token as string;
}
