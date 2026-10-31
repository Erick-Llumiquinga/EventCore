import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(
          "Error al conectar con el servidor. Verifica que el API Gateway esté encendido.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#202124]">
      <div className="w-full max-w-md">
        <div className="relative">
          {/* Subtle champagne glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#C7AA78] to-[#997943] opacity-15 blur-xl"></div>

          <div className="relative bg-[#282a2d] border border-[#777777]/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#C7AA78]/10 text-[#C7AA78] mb-4 border border-[#C7AA78]/25">
                <LogIn className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF]">
                Bienvenido de vuelta
              </h1>
              <p className="text-sm text-[#F2F0EB]/70 mt-1">
                Ingresa tus credenciales para acceder a tu cuenta
              </p>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#F2F0EB]/90 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@eventcore.com"
                    className="w-full pl-11 pr-4 py-3 bg-[#202124] border border-[#777777]/40 rounded-xl text-[#F2F0EB] placeholder-[#777777] text-sm focus:outline-none focus:border-[#C7AA78] focus:ring-1 focus:ring-[#C7AA78] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#F2F0EB]/90 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-[#202124] border border-[#777777]/40 rounded-xl text-[#F2F0EB] placeholder-[#777777] text-sm focus:outline-none focus:border-[#C7AA78] focus:ring-1 focus:ring-[#C7AA78] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#F2F0EB]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#C7AA78] hover:bg-[#d5bd92] text-[#202124] font-bold rounded-xl shadow-lg shadow-[#C7AA78]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Ingresar a EventCore</span>
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-6 text-center text-sm text-[#F2F0EB]/70">
              ¿No tienes una cuenta aún?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#C7AA78] hover:text-[#d5bd92]"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
