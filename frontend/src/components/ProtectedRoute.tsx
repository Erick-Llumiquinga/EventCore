import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
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

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#202124] p-6 text-[#F2F0EB]">
        <div className="max-w-md w-full bg-[#282a2d] border border-red-500/30 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2 text-[#FFFFFF]">Acceso no autorizado</h2>
          <p className="text-sm text-[#777777] mb-6">
            Tu rol actual (<span className="text-[#C7AA78] font-mono">{user.role}</span>) no tiene permisos para acceder a esta sección.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
