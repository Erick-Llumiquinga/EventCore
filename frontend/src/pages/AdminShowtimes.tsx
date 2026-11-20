import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  catalogApi,
  type CatalogCinemaDto,
  type CatalogAuditoriumDto,
  type CatalogMovieDto,
  type CatalogShowtimeDto,
} from "../api/catalog";
import {
  Film,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Building2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  MapPin,
  Tag,
  DollarSign,
  ArrowRight,
  Filter,
  Layers,
  X,
  Clapperboard,
} from "lucide-react";

const FORMAT_OPTIONS = ["2D", "3D", "IMAX", "VIP", "4DX"];

export const AdminShowtimes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"funciones" | "cartelera">(
    "funciones",
  );

  // Data states
  const [cinemas, setCinemas] = useState<CatalogCinemaDto[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | "">("");
  const [allMovies, setAllMovies] = useState<CatalogMovieDto[]>([]);
  const [cinemaMovies, setCinemaMovies] = useState<CatalogMovieDto[]>([]);
  const [showtimes, setShowtimes] = useState<CatalogShowtimeDto[]>([]);

  // Loading & feedback states
  const [isLoadingCinemas, setIsLoadingCinemas] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSyncingCartelera, setIsSyncingCartelera] = useState<boolean>(false);
  const [deletingShowtimeId, setDeletingShowtimeId] = useState<number | null>(
    null,
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters for showtimes tab
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterMovieId, setFilterMovieId] = useState<string>("all");

  // Show / Hide modal for new showtime
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form states for creating a showtime
  const [formMovieId, setFormMovieId] = useState<string>("");
  const [formAuditoriumId, setFormAuditoriumId] = useState<number | "">("");
  const [formDateTime, setFormDateTime] = useState<string>("");
  const [formFormat, setFormFormat] = useState<string>("2D");
  const [formGeneralPrice, setFormGeneralPrice] = useState<string>("6.50");
  const [formDiscountPrice, setFormDiscountPrice] = useState<string>("3.25");
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Initial load: Cinemas and global movies
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoadingCinemas(true);
      try {
        const [cinemasRes, moviesRes] = await Promise.all([
          catalogApi.getCinemas({ per_page: 50 }),
          catalogApi.getMovies({ per_page: 50 }),
        ]);

        if (!isMounted) return;

        setCinemas(cinemasRes.cinemas);
        setAllMovies(moviesRes.raw || []);

        if (cinemasRes.cinemas.length > 0) {
          setSelectedCinemaId(cinemasRes.cinemas[0].id);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "Error al cargar la información inicial",
          );
        }
      } finally {
        if (isMounted) setIsLoadingCinemas(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load cinema specific data (Auditoriums, Billboard movies, Showtimes)
  const loadCinemaDetails = useCallback(async () => {
    if (!selectedCinemaId) return;

    setIsLoadingData(true);
    setErrorMsg(null);
    try {
      // Load cinema with its billboard movies
      const cinemaDetail = await catalogApi.getCinemaDetail(selectedCinemaId);
      setCinemaMovies(cinemaDetail.movies || []);

      // Load showtimes for this cinema
      const showtimesRes = await catalogApi.getShowtimes({
        cinema_id: Number(selectedCinemaId),
        per_page: 100,
      });

      setShowtimes(showtimesRes.showtimes || []);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Error al cargar los datos del cine seleccionado",
      );
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedCinemaId]);

  useEffect(() => {
    loadCinemaDetails();
  }, [loadCinemaDetails]);

  // Auditoriums for the current selected cinema
  const availableAuditoriums = useMemo(() => {
    const currentCinema = cinemas.find((c) => c.id === Number(selectedCinemaId));
    return currentCinema?.auditoriums || [];
  }, [cinemas, selectedCinemaId]);

  // Billboard movie IDs set for quick lookup
  const billboardMovieIds = useMemo(() => {
    return new Set(cinemaMovies.map((m) => m.id));
  }, [cinemaMovies]);

  // Filtered showtimes
  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((st) => {
      if (filterMovieId !== "all" && st.movie_id !== filterMovieId) {
        return false;
      }
      if (filterDate) {
        const stDate = st.start_time.split("T")[0];
        if (stDate !== filterDate) return false;
      }
      return true;
    });
  }, [showtimes, filterMovieId, filterDate]);

  // Open modal with smart defaults
  const handleOpenModal = () => {
    setFormError(null);
    if (availableAuditoriums.length > 0) {
      setFormAuditoriumId(availableAuditoriums[0].id);
    } else {
      setFormAuditoriumId("");
    }

    if (cinemaMovies.length > 0) {
      setFormMovieId(cinemaMovies[0].id);
    } else if (allMovies.length > 0) {
      setFormMovieId(allMovies[0].id);
    }

    // Default to tomorrow at 18:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    setFormDateTime(localISOTime);

    setFormFormat("2D");
    setFormGeneralPrice("6.50");
    setFormDiscountPrice("3.25");
    setIsModalOpen(true);
  };

  // Submit new showtime
  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formMovieId) {
      setFormError("Por favor selecciona una película.");
      return;
    }
    if (!formAuditoriumId) {
      setFormError("Por favor selecciona una sala.");
      return;
    }
    if (!formDateTime) {
      setFormError("Por favor define la fecha y hora de la función.");
      return;
    }

    const genPrice = parseFloat(formGeneralPrice);
    const discPrice = parseFloat(formDiscountPrice);
    if (isNaN(genPrice) || genPrice <= 0) {
      setFormError("El precio de la tarifa general debe ser mayor a 0.");
      return;
    }

    // Check if start_time is in the future
    const selectedDate = new Date(formDateTime);
    if (selectedDate <= new Date()) {
      setFormError("La función debe programarse para una fecha y hora futura.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create showtime
      const createdShowtime = await catalogApi.createShowtime({
        movie_id: formMovieId,
        auditorium_id: Number(formAuditoriumId),
        start_time: selectedDate.toISOString(),
        format: formFormat,
      });

      // 2. Create ticket types (General and 3ra Edad / Preferencial)
      if (createdShowtime && createdShowtime.id) {
        await catalogApi.createTicketType({
          showtime_id: createdShowtime.id,
          name: "Adulto / General",
          price: genPrice,
        });

        if (!isNaN(discPrice) && discPrice > 0) {
          await catalogApi.createTicketType({
            showtime_id: createdShowtime.id,
            name: "3ra Edad / Niños",
            price: discPrice,
          });
        }
      }

      setSuccessMsg("¡Función y tarifas programadas exitosamente!");
      setIsModalOpen(false);
      await loadCinemaDetails();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Error al programar la función",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete showtime
  const handleDeleteShowtime = async (id: number) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar esta función programada?",
      )
    ) {
      return;
    }

    setDeletingShowtimeId(id);
    try {
      await catalogApi.deleteShowtime(id);
      setSuccessMsg("Función eliminada correctamente.");
      await loadCinemaDetails();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la función (puede tener reservas asociadas).",
      );
    } finally {
      setDeletingShowtimeId(null);
    }
  };

  // Toggle movie on cinema billboard
  const handleToggleBillboardMovie = async (movieId: string) => {
    if (!selectedCinemaId || isSyncingCartelera) return;

    const currentlyInBillboard = billboardMovieIds.has(movieId);
    let updatedIds: string[];

    if (currentlyInBillboard) {
      updatedIds = Array.from(billboardMovieIds).filter((id) => id !== movieId);
    } else {
      updatedIds = [...Array.from(billboardMovieIds), movieId];
    }

    setIsSyncingCartelera(true);
    try {
      await catalogApi.syncCinemaMovies(selectedCinemaId, updatedIds);
      await loadCinemaDetails();
      setSuccessMsg(
        currentlyInBillboard
          ? "Película retirada de la cartelera del cine."
          : "Película agregada a la cartelera del cine.",
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Error al actualizar la cartelera del cine.",
      );
    } finally {
      setIsSyncingCartelera(false);
    }
  };

  const currentCinemaObj = cinemas.find((c) => c.id === Number(selectedCinemaId));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#141518] text-[#F2F0EB] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#F2F0EB]/60">
            <Link to="/dashboard" className="hover:text-[#C7AA78] transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#C7AA78] font-semibold">
              Cartelera y Funciones
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/salas"
              className="px-3.5 py-1.5 rounded-xl bg-[#222429] border border-white/10 hover:border-[#C7AA78]/50 text-xs font-semibold text-[#F2F0EB]/80 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-[#C7AA78]" />
              <span>Administrar Salas</span>
            </Link>
          </div>
        </div>

        {/* Header Hero */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#222429] via-[#1b1c20] to-[#222429] border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#C7AA78]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C7AA78]/15 border border-[#C7AA78]/30 text-[#C7AA78] text-xs font-bold uppercase tracking-wider">
                <Clapperboard className="w-3.5 h-3.5" />
                Panel Administrativo
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Programación de Cartelera y Funciones
              </h1>
              <p className="text-sm text-[#F2F0EB]/70 max-w-2xl">
                Define las películas activas en cada complejo y programa los
                horarios de proyección con sus formatos y precios dinámicos.
              </p>
            </div>

            {/* Cinema Switcher */}
            <div className="w-full md:w-72 shrink-0 bg-[#141518]/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 space-y-1.5 shadow-lg">
              <label className="text-[11px] font-bold text-[#C7AA78] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Sede / Cine Activo
              </label>
              {isLoadingCinemas ? (
                <div className="flex items-center gap-2 text-xs text-[#F2F0EB]/60 py-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C7AA78]" />
                  <span>Cargando complejos...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedCinemaId}
                    onChange={(e) => setSelectedCinemaId(Number(e.target.value))}
                    className="w-full bg-[#222429] border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-semibold appearance-none focus:outline-none focus:border-[#C7AA78] transition-colors pr-8 cursor-pointer"
                  >
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#F2F0EB]/60 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
              {currentCinemaObj && (
                <p className="text-[11px] text-[#F2F0EB]/50 truncate">
                  {currentCinemaObj.address} &bull; {availableAuditoriums.length} salas
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("funciones")}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "funciones"
                  ? "bg-[#C7AA78] text-[#141518] shadow-lg shadow-[#C7AA78]/20"
                  : "bg-[#222429] text-[#F2F0EB]/75 hover:bg-[#282a30] hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Funciones Programadas</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-xs">
                {showtimes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cartelera")}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "cartelera"
                  ? "bg-[#C7AA78] text-[#141518] shadow-lg shadow-[#C7AA78]/20"
                  : "bg-[#222429] text-[#F2F0EB]/75 hover:bg-[#282a30] hover:text-white"
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Cartelera del Cine</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-xs">
                {cinemaMovies.length}
              </span>
            </button>
          </div>

          {activeTab === "funciones" && (
            <button
              type="button"
              onClick={handleOpenModal}
              disabled={availableAuditoriums.length === 0}
              className="py-2.5 px-4 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] disabled:opacity-50 disabled:cursor-not-allowed text-[#141518] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#C7AA78]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Función</span>
            </button>
          )}
        </div>

        {/* TAB 1: FUNCIONES PROGRAMADAS */}
        {activeTab === "funciones" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-[#222429] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F2F0EB]/70">
                  <Filter className="w-3.5 h-3.5 text-[#C7AA78]" />
                  <span>Filtrar:</span>
                </div>

                {/* Filter by movie */}
                <select
                  value={filterMovieId}
                  onChange={(e) => setFilterMovieId(e.target.value)}
                  className="bg-[#1b1c20] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#C7AA78] cursor-pointer"
                >
                  <option value="all">Todas las películas</option>
                  {allMovies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>

                {/* Filter by date */}
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-[#1b1c20] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#C7AA78] cursor-pointer"
                />

                {(filterMovieId !== "all" || filterDate !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMovieId("all");
                      setFilterDate("");
                    }}
                    className="text-xs text-[#C7AA78] hover:underline cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div className="text-xs text-[#F2F0EB]/60">
                Mostrando <span className="font-bold text-white">{filteredShowtimes.length}</span> funciones
              </div>
            </div>

            {/* Warning if cinema has no auditoriums */}
            {availableAuditoriums.length === 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>
                    Este cine aún no tiene salas registradas. Debes crear al menos una
                    sala antes de poder programar funciones.
                  </span>
                </div>
                <Link
                  to="/admin/salas"
                  className="px-3 py-1.5 rounded-lg bg-[#C7AA78] text-[#141518] font-bold text-xs shrink-0"
                >
                  Crear Salas
                </Link>
              </div>
            )}

            {/* Showtimes List */}
            {isLoadingData ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#C7AA78]" />
                <p className="text-sm text-[#F2F0EB]/70">
                  Cargando funciones programadas...
                </p>
              </div>
            ) : filteredShowtimes.length === 0 ? (
              <div className="py-16 text-center bg-[#1b1c20] border border-white/10 rounded-3xl p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#C7AA78]/10 text-[#C7AA78] flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    No hay funciones programadas
                  </h3>
                  <p className="text-xs text-[#F2F0EB]/60 max-w-md mx-auto">
                    {filterMovieId !== "all" || filterDate !== ""
                      ? "No se encontraron funciones que coincidan con los filtros seleccionados."
                      : "Comienza programando la primera función para este complejo."}
                  </p>
                </div>
                {availableAuditoriums.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C7AA78] text-[#141518] font-bold text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Programar Función Ahora</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShowtimes.map((st) => {
                  const dateObj = new Date(st.start_time);
                  const dateStr = dateObj.toLocaleDateString("es-EC", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const timeStr = dateObj.toLocaleTimeString("es-EC", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });

                  // Look up movie details
                  const movie = allMovies.find((m) => m.id === st.movie_id);

                  return (
                    <div
                      key={st.id}
                      className="bg-[#1b1c20] border border-white/10 hover:border-[#C7AA78]/40 rounded-2xl p-4 transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <span className="px-2 py-0.5 rounded bg-[#C7AA78]/20 text-[#C7AA78] text-[10px] uppercase font-extrabold tracking-wider">
                            {st.format}
                          </span>
                          <h4 className="text-sm font-bold text-white truncate">
                            {movie?.title || "Película no identificada"}
                          </h4>
                          <p className="text-xs text-[#F2F0EB]/60 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-[#C7AA78]" />
                            {st.auditorium?.name || "Sala Principal"}
                            {st.auditorium?.capacity && (
                              <span>({st.auditorium.capacity} butacas)</span>
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteShowtime(st.id)}
                          disabled={deletingShowtimeId === st.id}
                          className="p-2 rounded-xl bg-transparent hover:bg-red-500/10 text-[#F2F0EB]/40 hover:text-red-400 transition-colors cursor-pointer"
                          title="Eliminar función"
                        >
                          {deletingShowtimeId === st.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Date & Time Badge */}
                      <div className="bg-[#222429] rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-white font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-[#C7AA78]" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#C7AA78] font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{timeStr}</span>
                        </div>
                      </div>

                      {/* Ticket Types Prices */}
                      <div className="pt-1 border-t border-white/5 space-y-1">
                        <span className="text-[10px] text-[#F2F0EB]/50 uppercase font-semibold">
                          Tarifas asignadas:
                        </span>
                        {st.ticket_types && st.ticket_types.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {st.ticket_types.map((tt) => (
                              <span
                                key={tt.id}
                                className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-[#F2F0EB]/80 font-medium"
                              >
                                {tt.name}: <strong className="text-[#C7AA78]">${Number(tt.price).toFixed(2)}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#F2F0EB]/40 italic">
                            Tarifas estándar del complejo
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CARTELERA DEL CINE (BILLBOARD) */}
        {activeTab === "cartelera" && (
          <div className="space-y-6">
            <div className="bg-[#222429] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Películas disponibles en este complejo
                </h3>
                <p className="text-xs text-[#F2F0EB]/60">
                  Activa o desactiva las películas que estarán en exhibición para{" "}
                  <strong className="text-[#C7AA78]">{currentCinemaObj?.name}</strong>.
                </p>
              </div>

              {isSyncingCartelera && (
                <div className="flex items-center gap-2 text-xs text-[#C7AA78] font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Actualizando cartelera...</span>
                </div>
              )}
            </div>

            {allMovies.length === 0 ? (
              <div className="py-16 text-center bg-[#1b1c20] border border-white/10 rounded-3xl p-8">
                <Film className="w-10 h-10 text-[#C7AA78] mx-auto mb-3" />
                <p className="text-sm text-white font-bold">
                  No hay películas en el catálogo global
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allMovies.map((movie) => {
                  const isInBillboard = billboardMovieIds.has(movie.id);

                  return (
                    <div
                      key={movie.id}
                      className={`rounded-2xl border transition-all p-3.5 flex flex-col justify-between gap-3 ${
                        isInBillboard
                          ? "bg-[#1b1c20] border-[#C7AA78]/50 shadow-md shadow-[#C7AA78]/5"
                          : "bg-[#17181c] border-white/5 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Poster thumbnail */}
                        <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-black/40 relative">
                          <img
                            src={
                              movie.poster_url ||
                              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80"
                            }
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isInBillboard
                                  ? "bg-emerald-500 text-white"
                                  : "bg-black/60 text-white/70"
                              }`}
                            >
                              {isInBillboard ? "En Cartelera" : "Inactiva"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white truncate">
                            {movie.title}
                          </h4>
                          <p className="text-xs text-[#F2F0EB]/60">
                            {movie.duration_minutes} min &bull; {movie.rating || "TP"}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleBillboardMovie(movie.id)}
                        disabled={isSyncingCartelera}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isInBillboard
                            ? "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30"
                            : "bg-[#C7AA78] hover:bg-[#d5bd92] text-[#141518] shadow-md shadow-[#C7AA78]/20"
                        }`}
                      >
                        {isInBillboard ? (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>Quitar de Cartelera</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar a Cartelera</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL: PROGRAMAR NUEVA FUNCIÓN */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1b1c20] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#C7AA78]/20 text-[#C7AA78] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Programar Nueva Función
                    </h3>
                    <p className="text-xs text-[#F2F0EB]/60">
                      {currentCinemaObj?.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-[#F2F0EB]/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateShowtime} className="space-y-4">
                {/* 1. Película */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F2F0EB]/80 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-[#C7AA78]" />
                    Película
                  </label>
                  <select
                    value={formMovieId}
                    onChange={(e) => setFormMovieId(e.target.value)}
                    required
                    className="w-full bg-[#222429] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#C7AA78]"
                  >
                    {allMovies.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.duration_minutes} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Sala */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F2F0EB]/80 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#C7AA78]" />
                    Sala de Proyección
                  </label>
                  <select
                    value={formAuditoriumId}
                    onChange={(e) => setFormAuditoriumId(Number(e.target.value))}
                    required
                    className="w-full bg-[#222429] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#C7AA78]"
                  >
                    {availableAuditoriums.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Capacidad: {a.capacity} butacas
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Fecha y Hora + Formato */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#F2F0EB]/80 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C7AA78]" />
                      Fecha y Hora
                    </label>
                    <input
                      type="datetime-local"
                      value={formDateTime}
                      onChange={(e) => setFormDateTime(e.target.value)}
                      required
                      className="w-full bg-[#222429] border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#C7AA78]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#F2F0EB]/80 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#C7AA78]" />
                      Formato
                    </label>
                    <select
                      value={formFormat}
                      onChange={(e) => setFormFormat(e.target.value)}
                      className="w-full bg-[#222429] border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#C7AA78]"
                    >
                      {FORMAT_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Precios de Boletos */}
                <div className="p-3.5 rounded-2xl bg-[#222429] border border-white/10 space-y-3">
                  <span className="text-xs font-bold text-[#C7AA78] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Tarifas de Boletos para esta Función
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#F2F0EB]/70 font-semibold">
                        Adulto / General ($)
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="1"
                        value={formGeneralPrice}
                        onChange={(e) => setFormGeneralPrice(e.target.value)}
                        required
                        className="w-full bg-[#1b1c20] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#C7AA78]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#F2F0EB]/70 font-semibold">
                        3ra Edad / Niños ($)
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={formDiscountPrice}
                        onChange={(e) => setFormDiscountPrice(e.target.value)}
                        className="w-full bg-[#1b1c20] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#C7AA78]"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-[#F2F0EB]/70 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] disabled:opacity-50 text-[#141518] font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#C7AA78]/20 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar y Publicar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
