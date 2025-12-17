import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "./store";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = useSelector((s: RootState) => s.auth.accessToken);

  if (!token) return <Navigate to="/login" replace />;
  return children;
}
