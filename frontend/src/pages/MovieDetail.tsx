import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  catalogApi,
  mapCatalogMovieToMovie,
  type CatalogMovieDetailDto,
} from "../api/catalog";
import { useAuth } from "../context/AuthContext";
import { useBooking } from "../context/BookingContext";
import { LoginModal } from "../components/LoginModal";
import {
  Clock,
  Calendar,
  MapPin,
  Ticket,
  Film,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { setSelectedMovie } = useBooking();

  const [movieDetail, setMovieDetail] = useState<CatalogMovieDetailDto | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchDetail = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await catalogApi.getMovieById(id);
        if (isMounted) {
          setMovieDetail(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la información de la película.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBookMovie = () => {
    if (!movieDetail) return;
    const mapped = mapCatalogMovieToMovie(movieDetail);
    setSelectedMovie(mapped);

    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    navigate("/funcion");
  };

  const formatShowtimeDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("es-EC", {
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

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#141518] flex flex-col items-center justify-center gap-3 text-[#F2F0EB]/75">
        <Loader2 className="w-9 h-9 text-[#C7AA78] animate-spin" />
        <p className="text-sm font-medium">
          Cargando información detallada de la película...
        </p>
      </div>
    );
  }

  if (errorMsg || !movieDetail) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-[#1b1c20] border border-red-500/30 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">
            No se encontró la película
          </h2>
          <p className="text-sm text-[#F2F0EB]/70">
            {errorMsg || "El recurso solicitado no está disponible."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C7AA78] text-[#1c1d21] font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel =
    movieDetail.status === "published"
      ? "En cartelera"
      : movieDetail.status === "draft"
        ? "Próximamente"
        : "Finalizada";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#141518] text-[#F2F0EB] pb-16">
      {/* Hero Banner with Blurred Backdrop */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#1b1c20]">
        <div className="absolute inset-0 opacity-25 blur-2xl scale-110 pointer-events-none">
          <img
            src={movieDetail.poster_url || "/images/horizontes.jpg"}
            alt={movieDetail.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#141518] via-[#141518]/80 to-[#141518]/60 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#F2F0EB]/70 hover:text-[#C7AA78] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la cartelera principal</span>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Movie Poster */}
            <div className="md:col-span-4 lg:col-span-4">
              <div className="rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#18191c]">
                <img
                  src={movieDetail.poster_url || "/images/horizontes.jpg"}
                  alt={movieDetail.title}
                  className="w-full aspect-[4/4.5] object-cover"
                />
              </div>
            </div>

            {/* Movie Primary Info */}
            <div className="md:col-span-8 lg:col-span-8 space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C7AA78] text-[#141518] text-xs font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  {statusLabel}
                </span>

                {movieDetail.rating && (
                  <span className="px-3 py-1 rounded-full bg-[#222429] border border-[#C7AA78]/40 text-[#C7AA78] text-xs font-extrabold">
                    Clasificación {movieDetail.rating}
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222429] border border-white/10 text-[#F2F0EB]/85 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#C7AA78]" />
                  {movieDetail.duration_minutes} minutos
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {movieDetail.title}
              </h1>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#C7AA78]">
                  Sinopsis
                </h3>
                <p className="text-sm sm:text-base text-[#F2F0EB]/80 leading-relaxed max-w-2xl">
                  {movieDetail.description || "Sin descripción disponible."}
                </p>
              </div>

              {/* Technical Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 max-w-xl">
                <div className="bg-[#222429]/90 border border-white/10 rounded-2xl p-4">
                  <span className="text-[11px] text-[#F2F0EB]/55 block">
                    Duración
                  </span>
                  <span className="text-base font-extrabold text-white">
                    {movieDetail.duration_minutes} min
                  </span>
                </div>

                <div className="bg-[#222429]/90 border border-white/10 rounded-2xl p-4">
                  <span className="text-[11px] text-[#F2F0EB]/55 block">
                    Clasificación
                  </span>
                  <span className="text-base font-extrabold text-[#C7AA78]">
                    {movieDetail.rating || "Todo público"}
                  </span>
                </div>

                <div className="bg-[#222429]/90 border border-white/10 rounded-2xl p-4 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-[#F2F0EB]/55 block">
                    Estado
                  </span>
                  <span className="text-base font-extrabold text-white">
                    {statusLabel}
                  </span>
                </div>
              </div>

              {/* Action CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleBookMovie}
                  className="px-8 py-4 rounded-2xl bg-[#C7AA78] hover:bg-[#d5bd92] text-[#141518] font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-[#C7AA78]/20 transition-all cursor-pointer"
                >
                  <Ticket className="w-5 h-5" />
                  <span>Reservar boletos para esta película</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cinemas & Showtimes from GET /api/catalog/movies/{id} */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12">
        {/* Cines donde se proyecta */}
        <section className="space-y-5">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#C7AA78]" />
            <h2 className="text-xl font-extrabold text-white">
              Cines con esta película en cartelera
            </h2>
          </div>

          {!movieDetail.cinemas || movieDetail.cinemas.length === 0 ? (
            <div className="bg-[#1b1c20] border border-white/10 rounded-2xl p-6 text-sm text-[#F2F0EB]/65">
              Aún no hay cines asignados para esta película.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {movieDetail.cinemas.map((cinema) => (
                <div
                  key={cinema.id}
                  className="bg-[#1b1c20] border border-white/10 rounded-2xl p-5 flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#C7AA78]/15 border border-[#C7AA78]/30 flex items-center justify-center text-[#C7AA78] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">
                      {cinema.name}
                    </h3>
                    <p className="text-xs text-[#F2F0EB]/65">
                      {cinema.address}
                    </p>
                    <span className="inline-block text-[11px] font-semibold text-[#C7AA78]">
                      {cinema.city}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Funciones programadas (Showtimes) */}
        <section className="space-y-5">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#C7AA78]" />
            <h2 className="text-xl font-extrabold text-white">
              Funciones y Horarios Disponibles
            </h2>
          </div>

          {!movieDetail.showtimes || movieDetail.showtimes.length === 0 ? (
            <div className="bg-[#1b1c20] border border-white/10 rounded-2xl p-6 text-sm text-[#F2F0EB]/65">
              No hay funciones programadas actualmente para esta película.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {movieDetail.showtimes.map((showtime) => (
                <div
                  key={showtime.id}
                  className="bg-[#1b1c20] border border-white/10 hover:border-[#C7AA78]/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-[#C7AA78]" />
                        <span className="text-sm font-bold text-white">
                          {showtime.auditorium?.cinema?.name || "Cine EventCore"}{" "}
                          &bull; {showtime.auditorium?.name || "Sala Principal"}
                        </span>
                      </div>
                      <p className="text-xs text-[#F2F0EB]/70">
                        Horario:{" "}
                        <span className="font-semibold text-white">
                          {formatShowtimeDate(showtime.start_time)}
                        </span>
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-[#C7AA78]/15 border border-[#C7AA78]/35 text-[#C7AA78] text-xs font-extrabold">
                      {showtime.format}
                    </span>
                  </div>

                  {/* Ticket Types */}
                  {showtime.ticket_types && showtime.ticket_types.length > 0 && (
                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                      {showtime.ticket_types.map((tt) => (
                        <span
                          key={tt.id}
                          className="px-2.5 py-1 rounded-lg bg-[#222429] border border-white/10 text-xs text-[#F2F0EB]/85"
                        >
                          {tt.name}:{" "}
                          <strong className="text-[#C7AA78]">
                            ${Number(tt.price).toFixed(2)}
                          </strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Login Modal if unauthenticated user clicks "Reservar boletos" */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
        }}
      />
    </div>
  );
};

