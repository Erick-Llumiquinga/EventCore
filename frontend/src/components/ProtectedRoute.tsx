import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#202124] text-[#F2F0EB]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#C7AA78] animate-spin" />
          <p className="text-sm text-[#777777]">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentRoleSlug = (role?.slug || user?.role || "").toLowerCase();

  if (
    allowedRoles &&
    !allowedRoles.map((r) => r.toLowerCase()).includes(currentRoleSlug)
  ) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#141518] p-6 text-[#F2F0EB]">
        <div className="max-w-md w-full bg-[#1b1c20] border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Acceso restringido
          </h2>
          <p className="text-sm text-[#F2F0EB]/70">
            Esta sección es exclusiva para el rol{" "}
            <strong className="text-[#C7AA78]">Super Admin</strong>. Tu rol
            actual (<span className="text-[#C7AA78] font-mono">{currentRoleSlug}</span>) no cuenta con permisos de acceso.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] text-[#141518] font-bold text-sm transition-all"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
