import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

export function DashboardPage() {
  const token = useSelector((s: RootState) => s.auth.accessToken);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Admin Dashboard</h1>
      <p>Access token:</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{token ?? "нет токена"}</pre>
    </div>
  );
}
