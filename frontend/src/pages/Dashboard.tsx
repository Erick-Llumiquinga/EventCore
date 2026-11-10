import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Shield,
  Hash,
  Sparkles,
  Phone,
  IdCard,
  CheckCircle2,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, person, role } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#202124] text-[#F2F0EB] p-6 lg:p-12 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="relative">
          {/* Subtle champagne glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#C7AA78] to-[#997943] opacity-15 blur-xl"></div>

          <div className="relative bg-[#282a2d] border border-[#777777]/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-[#777777]/20">
              <div className="w-16 h-16 rounded-2xl bg-[#C7AA78]/15 border border-[#C7AA78]/30 flex items-center justify-center text-[#C7AA78] text-2xl font-bold shrink-0">
                {(person?.full_name || user?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C7AA78]/10 border border-[#C7AA78]/25 text-[#C7AA78] text-[11px] font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Perfil de Usuario
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF]">
                  {person?.full_name || user?.name}
                </h1>
                <p className="text-xs text-[#777777]">
                  {role?.description || "Sesión activa en EventCore"}
                </p>
              </div>
            </div>

            {/* User, Person & Role Data List */}
            <div className="space-y-3.5">
              {/* User ID & Status */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#202124] border border-[#777777]/25">
                <div className="flex items-center gap-3 text-sm text-[#777777]">
                  <Hash className="w-4 h-4 text-[#C7AA78]" />
                  <span>ID de Usuario</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-semibold text-[#FFFFFF]">
                    #{user?.id}
                  </span>
                  {user?.is_active && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Activo
                    </span>
                  )}
                </div>
              </div>

              {/* Identification (Cédula / RUC) */}
              {person?.identification && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#202124] border border-[#777777]/25">
                  <div className="flex items-center gap-3 text-sm text-[#777777]">
                    <IdCard className="w-4 h-4 text-[#C7AA78]" />
                    <span>Identificación</span>
                  </div>
                  <span className="font-mono text-sm font-medium text-[#FFFFFF]">
                    {person.identification}
                  </span>
                </div>
              )}

              {/* Full Name */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#202124] border border-[#777777]/25">
                <div className="flex items-center gap-3 text-sm text-[#777777]">
                  <User className="w-4 h-4 text-[#C7AA78]" />
                  <span>Nombre Completo</span>
                </div>
                <span className="text-sm font-medium text-[#FFFFFF]">
                  {person?.full_name || user?.name}
                </span>
              </div>

              {/* Phone */}
              {person?.phone && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#202124] border border-[#777777]/25">
                  <div className="flex items-center gap-3 text-sm text-[#777777]">
                    <Phone className="w-4 h-4 text-[#C7AA78]" />
                    <span>Teléfono</span>
                  </div>
                  <span className="text-sm font-medium text-[#FFFFFF]">
                    {person.phone}
                  </span>
                </div>
              )}

              {/* Email */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#202124] border border-[#777777]/25">
                <div className="flex items-center gap-3 text-sm text-[#777777]">
                  <Mail className="w-4 h-4 text-[#C7AA78]" />
                  <span>Correo Electrónico</span>
                </div>
                <span className="text-sm font-medium text-[#FFFFFF]">
                  {user?.email}
                </span>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#202124] border border-[#777777]/25">
                <div className="flex items-center gap-3 text-sm text-[#777777]">
                  <Shield className="w-4 h-4 text-[#C7AA78]" />
                  <span>Rol asignado</span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-[#C7AA78]/20 border border-[#C7AA78]/30 text-[#C7AA78] text-xs font-bold uppercase tracking-wide">
                  {role?.name || user?.role_name || user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
