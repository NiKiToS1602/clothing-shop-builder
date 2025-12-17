import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../app/store";
import { setAccessToken } from "../features/auth/authSlice";
import { refreshAccessToken } from "../shared/api/auth";

export function DashboardPage() {
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.accessToken);

  async function handleRefresh() {
    const newToken = await refreshAccessToken();
    if (newToken) dispatch(setAccessToken(newToken));
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Admin Dashboard</h1>

      <button onClick={handleRefresh} style={{ padding: 10, marginBottom: 12 }}>
        Обновить access token (refresh)
      </button>

      <p>Access token:</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{token ?? "нет токена"}</pre>
    </div>
  );
}
