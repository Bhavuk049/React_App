import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || user.role !== "ADMIN") return <Navigate to="/login" replace />;

  return <Outlet />;
}
