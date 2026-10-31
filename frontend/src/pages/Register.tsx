import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import axios from 'axios';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState<'admin' | 'organizer' | 'attendee'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    if (password !== passwordConfirmation) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.errors) {
          setFieldErrors(err.response.data.errors);
        }
        setErrorMsg(err.response?.data?.message || 'Error al registrar usuario');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Error de conexión con el backend.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#202124]">
      <div className="w-full max-w-lg">
        <div className="relative">
          {/* Subtle champagne glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#C7AA78] to-[#997943] opacity-15 blur-xl"></div>

          <div className="relative bg-[#282a2d] border border-[#777777]/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#C7AA78]/10 text-[#C7AA78] mb-4 border border-[#C7AA78]/25">
                <UserPlus className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF]">
                Crea tu cuenta
              </h1>
              <p className="text-sm text-[#F2F0EB]/70 mt-1">
                Únete a la plataforma de gestión de eventos
              </p>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{errorMsg}</p>
                  {Object.keys(fieldErrors).length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-xs text-red-400 space-y-0.5">
                      {Object.entries(fieldErrors).flatMap(([field, errors]) =>
                        errors.map((err, i) => (
                          <li key={`${field}-${i}`}>{err}</li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#F2F0EB]/90 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Erick Llumiquinga"
                    className="w-full pl-11 pr-4 py-2.5 bg-[#202124] border border-[#777777]/40 rounded-xl text-[#F2F0EB] placeholder-[#777777] text-sm focus:outline-none focus:border-[#C7AA78] focus:ring-1 focus:ring-[#C7AA78] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#F2F0EB]/90 mb-1.5">
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
                    className="w-full pl-11 pr-4 py-2.5 bg-[#202124] border border-[#777777]/40 rounded-xl text-[#F2F0EB] placeholder-[#777777] text-sm focus:outline-none focus:border-[#C7AA78] focus:ring-1 focus:ring-[#C7AA78] transition-all"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#F2F0EB]/90 mb-1.5">
                  Rol Inicial
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'admin', label: 'Admin' },
                    { id: 'organizer', label: 'Organizador' },
                    { id: 'attendee', label: 'Asistente' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as 'admin' | 'organizer' | 'attendee')}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        role === r.id
                          ? 'bg-[#C7AA78]/20 border-[#C7AA78] text-[#C7AA78]'
                          : 'bg-[#202124] border-[#777777]/30 text-[#777777] hover:border-[#777777]/60 hover:text-[#F2F0EB]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#F2F0EB]/90 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 car."
                      className="w-full pl-11 pr-10 py-2.5 bg-[#202124] border border-[#777777]/40 rounded-xl text-[#F2F0EB] placeholder-[#777777] text-sm focus:outline-none focus:border-[#C7AA78] focus:ring-1 focus:ring-[#C7AA78] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#F2F0EB]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#F2F0EB]/90 mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-5 h-5 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="Repite pass"
                      className="w-full pl-11 pr-4 py-2.5 bg-[#202124] border border-[#777777]/40 rounded-xl text-[#F2F0EB] placeholder-[#777777] text-sm focus:outline-none focus:border-[#C7AA78] focus:ring-1 focus:ring-[#C7AA78] transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-[#C7AA78] hover:bg-[#d5bd92] text-[#202124] font-bold rounded-xl shadow-lg shadow-[#C7AA78]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Registrando cuenta...</span>
                  </>
                ) : (
                  <span>Registrar Cuenta</span>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#F2F0EB]/70">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-[#C7AA78] hover:text-[#d5bd92]">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
