import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bookingApi, type ReservationDto } from "../api/booking";
import { useBooking } from "../context/BookingContext";
import {
  User,
  Mail,
  Shield,
  Hash,
  Sparkles,
  Phone,
  IdCard,
  CheckCircle2,
  Building2,
  ArrowRight,
  Ticket,
  Calendar,
  Armchair,
  QrCode,
  Loader2,
  AlertCircle,
  Clock,
  X,
  Copy,
  Check,
  RefreshCw,
  Download,
  Clapperboard,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, person, role } = useAuth();
  const { setCurrentReservation, setSelectedSeats, setSelectedMovie } = useBooking();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const roleSlug = (role?.slug || user?.role || "").toLowerCase();
  const isSuperAdmin = roleSlug === "admin" || roleSlug === "super_admin";

  const initialTab = searchParams.get("tab") === "reservas" ? "reservas" : "perfil";
  const [activeTab, setActiveTab] = useState<"perfil" | "reservas">(initialTab);

  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [isLoadingReservas, setIsLoadingReservas] = useState<boolean>(false);
  const [reservasError, setReservasError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected reservation for QR modal
  const [selectedQrReservation, setSelectedQrReservation] = useState<ReservationDto | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [cancellingCode, setCancellingCode] = useState<string | null>(null);

  // Sync tab with URL
  const handleTabChange = (tab: "perfil" | "reservas") => {
    setActiveTab(tab);
    setSearchParams(tab === "reservas" ? { tab: "reservas" } : {});
  };

  const loadReservations = async () => {
    setIsLoadingReservas(true);
    setReservasError(null);
    try {
      const data = await bookingApi.getMyReservations();
      setReservations(data.reservations || []);
    } catch (err: unknown) {
      setReservasError(
        err instanceof Error ? err.message : "Error al cargar las reservas",
      );
    } finally {
      setIsLoadingReservas(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reservas") {
      loadReservations();
    }
  }, [activeTab]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCancelReservation = async (code: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas cancelar la reserva ${code}?`)) {
      return;
    }

    setCancellingCode(code);
    try {
      await bookingApi.cancelReservation(code);
      await loadReservations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al cancelar la reserva");
    } finally {
      setCancellingCode(null);
    }
  };

  const handlePayPending = (res: ReservationDto) => {
    setCurrentReservation(res);
    setSelectedSeats(res.seats || []);
    setSelectedMovie({
      id: String(res.showtime_id),
      title: res.movie_title,
      genre: "Cine",
      duration: "120 min",
      ageRating: "Todo público",
      rating: 8.5,
      synopsis: "",
      poster: "/images/horizontes.jpg",
      room: res.auditorium_name,
    });
    navigate("/pago");
  };

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmada
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Pendiente (10m)
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
            Cancelada
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-500/30 text-gray-400 text-xs font-bold uppercase tracking-wider">
            Expirada
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase">
            {status}
          </span>
        );
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "Fecha no disponible";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("es-EC", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#202124] text-[#F2F0EB] p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#777777]/20 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange("perfil")}
              className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "perfil"
                  ? "bg-[#C7AA78] text-[#1c1d21] shadow-lg shadow-[#C7AA78]/20"
                  : "bg-[#282a2d] text-[#F2F0EB]/75 hover:bg-[#323438] hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Mi Perfil</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("reservas")}
              className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "reservas"
                  ? "bg-[#C7AA78] text-[#1c1d21] shadow-lg shadow-[#C7AA78]/20"
                  : "bg-[#282a2d] text-[#F2F0EB]/75 hover:bg-[#323438] hover:text-white"
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Mis Reservas</span>
              {reservations.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#1c1d21] text-[#C7AA78] text-xs font-extrabold flex items-center justify-center">
                  {reservations.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "reservas" && (
            <button
              type="button"
              onClick={loadReservations}
              disabled={isLoadingReservas}
              className="p-2 rounded-xl bg-[#282a2d] border border-white/10 hover:border-[#C7AA78]/50 text-[#F2F0EB]/80 hover:text-white transition-colors cursor-pointer"
              title="Actualizar reservas"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingReservas ? "animate-spin text-[#C7AA78]" : ""}`} />
            </button>
          )}
        </div>

        {/* Tab 1: Perfil de Usuario */}
        {activeTab === "perfil" && (
          <div className="relative">
            {/* Subtle champagne glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#C7AA78] to-[#997943] opacity-15 blur-xl"></div>

            <div className="relative bg-[#282a2d] border border-[#777777]/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
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

              {/* Super Admin Action Links */}
              {isSuperAdmin && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    to="/admin/funciones"
                    className="py-3.5 px-4 rounded-2xl bg-[#C7AA78] hover:bg-[#d5bd92] text-[#202124] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C7AA78]/20 transition-all cursor-pointer"
                  >
                    <Clapperboard className="w-4 h-4" />
                    <span>Cartelera y Funciones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to="/admin/salas"
                    className="py-3.5 px-4 rounded-2xl bg-[#202124] hover:bg-[#1a1b1e] border border-[#C7AA78]/40 hover:border-[#C7AA78] text-[#C7AA78] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Administrar Salas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Mis Reservas (Conectado con booking-service) */}
        {activeTab === "reservas" && (
          <div className="space-y-6">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "Todas" },
                { id: "confirmed", label: "Confirmadas" },
                { id: "pending", label: "Pendientes" },
                { id: "cancelled", label: "Canceladas" },
                { id: "expired", label: "Expiradas" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === pill.id
                      ? "bg-[#C7AA78] text-[#1c1d21] shadow-md shadow-[#C7AA78]/20"
                      : "bg-[#282a2d] border border-white/10 text-[#F2F0EB]/70 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {isLoadingReservas ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#F2F0EB]/70">
                <Loader2 className="w-8 h-8 text-[#C7AA78] animate-spin" />
                <span className="text-sm">Cargando tus reservas de EventCore...</span>
              </div>
            ) : reservasError ? (
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-sm">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{reservasError}</span>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="bg-[#282a2d] border border-white/10 rounded-3xl p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#C7AA78]/15 border border-[#C7AA78]/30 flex items-center justify-center text-[#C7AA78] mx-auto">
                  <Ticket className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  No hay reservas {statusFilter !== "all" ? `con estado "${statusFilter}"` : "registradas"}
                </h3>
                <p className="text-sm text-[#F2F0EB]/65 max-w-sm mx-auto">
                  Explora las películas disponibles en cartelera y reserva tus entradas al instante.
                </p>
                <Link
                  to="/peliculas"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C7AA78] text-[#1c1d21] font-bold text-sm shadow-lg shadow-[#C7AA78]/20 hover:bg-[#d5bd92] transition-colors"
                >
                  <span>Explorar Cartelera</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReservations.map((res) => (
                  <div
                    key={res.id}
                    className="bg-[#282a2d] border border-white/10 hover:border-[#C7AA78]/40 rounded-3xl p-6 transition-all shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-extrabold text-[#C7AA78] tracking-wider">
                          {res.booking_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(res.booking_code)}
                          title="Copiar código"
                          className="p-1 rounded text-[#777777] hover:text-[#C7AA78] transition-colors"
                        >
                          {copiedCode === res.booking_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {getStatusBadge(res.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[#F2F0EB]/55 block mb-1">Película</span>
                        <span className="font-bold text-white text-sm block">
                          {res.movie_title}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#F2F0EB]/55 block mb-1">Cine & Sala</span>
                        <span className="text-[#F2F0EB]/90 font-medium block">
                          {res.cinema_name}
                        </span>
                        <span className="text-[#C7AA78]">{res.auditorium_name}</span>
                      </div>

                      <div>
                        <span className="text-[#F2F0EB]/55 block mb-1">Función</span>
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#C7AA78]" />
                          <span>{formatDateTime(res.showtime_start)}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[#F2F0EB]/55 block mb-1">Asientos & Total</span>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <Armchair className="w-3.5 h-3.5 text-[#C7AA78]" />
                          <span>{res.seats?.join(", ") || "Sin asientos"}</span>
                        </div>
                        <span className="text-[#C7AA78] font-extrabold text-sm block mt-0.5">
                          ${Number(res.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                      {res.status === "confirmed" && (
                        <button
                          type="button"
                          onClick={() => setSelectedQrReservation(res)}
                          className="px-4 py-2 rounded-xl bg-[#C7AA78] text-[#1c1d21] font-bold text-xs flex items-center gap-2 hover:bg-[#d5bd92] transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Ver Código QR</span>
                        </button>
                      )}

                      {res.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCancelReservation(res.booking_code)}
                            disabled={cancellingCode === res.booking_code}
                            className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 font-bold text-xs hover:bg-red-500/25 transition-colors cursor-pointer"
                          >
                            {cancellingCode === res.booking_code ? "Cancelando..." : "Cancelar Reserva"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePayPending(res)}
                            className="px-4 py-2 rounded-xl bg-[#C7AA78] text-[#1c1d21] font-bold text-xs flex items-center gap-1.5 hover:bg-[#d5bd92] transition-colors cursor-pointer"
                          >
                            <span>Pagar Ahora</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Ver Código QR Digital */}
        {selectedQrReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative bg-[#1b1c20] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
              <button
                type="button"
                onClick={() => setSelectedQrReservation(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-[#777777] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Entrada Válida
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  {selectedQrReservation.movie_title}
                </h3>
                <p className="text-xs text-[#F2F0EB]/65">
                  {selectedQrReservation.cinema_name} &bull; {selectedQrReservation.auditorium_name}
                </p>
              </div>

              {/* QR Image */}
              <div className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
                {selectedQrReservation.qr_svg_data_uri ? (
                  <img
                    src={selectedQrReservation.qr_svg_data_uri}
                    alt={`QR ${selectedQrReservation.booking_code}`}
                    className="w-full h-full object-contain"
                  />
                ) : selectedQrReservation.qr_svg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedQrReservation.qr_svg }}
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  />
                ) : (
                  <QrCode className="w-32 h-32 text-gray-800" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[#F2F0EB]/60">Código de Reserva:</p>
                <span className="font-mono text-xl font-extrabold text-[#C7AA78] tracking-widest block">
                  {selectedQrReservation.booking_code}
                </span>
                <p className="text-xs text-[#F2F0EB]/75 font-medium">
                  Asientos: {selectedQrReservation.seats?.join(", ")}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-3 px-4 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] text-[#1c1d21] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar / Imprimir</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
