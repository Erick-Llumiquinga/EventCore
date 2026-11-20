import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Ticket,
  Minus,
  Plus,
  Loader2,
  Film,
} from "lucide-react";
import {
  CINEMAS,
  DATES,
  type DateOption,
  SHOWTIMES,
} from "../data/mockCinema";
import {
  catalogApi,
  type CatalogCinemaDto,
  type CatalogShowtimeDto,
} from "../api/catalog";
import { useBooking } from "../context/BookingContext";

export const SelectShowtime: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedMovie,
    selectedCinema,
    setSelectedCinema,
    selectedCinemaId,
    setSelectedCinemaId,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    selectedShowtime,
    setSelectedShowtime,
    adultTickets,
    setAdultTickets,
    discountTickets,
    setDiscountTickets,
    totalTickets,
    totalPrice,
    ticketPrice,
    discountTicketPrice,
  } = useBooking();

  const [cinemas, setCinemas] = useState<CatalogCinemaDto[]>([]);
  const [showtimes, setShowtimes] = useState<CatalogShowtimeDto[]>([]);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState<boolean>(false);

  // 1. Load cinemas from catalog API
  useEffect(() => {
    let isMounted = true;
    const loadCinemas = async () => {
      try {
        const res = await catalogApi.getCinemas();
        if (isMounted && res.cinemas.length > 0) {
          setCinemas(res.cinemas);
          if (!selectedCinemaId) {
            setSelectedCinemaId(res.cinemas[0].id);
            setSelectedCinema(res.cinemas[0].name);
          }
        }
      } catch (e) {
        console.warn("No se pudieron cargar cines desde la API:", e);
      }
    };
    loadCinemas();
    return () => {
      isMounted = false;
    };
  }, [selectedCinemaId, setSelectedCinema, setSelectedCinemaId]);

  // 2. Load showtimes for selected movie & cinema from catalog API
  useEffect(() => {
    let isMounted = true;
    const loadShowtimes = async () => {
      setIsLoadingShowtimes(true);
      try {
        // Query showtimes by movie_id and cinema_id
        const res = await catalogApi.getShowtimes({
          movie_id: selectedMovie.id,
          cinema_id: selectedCinemaId,
        });

        if (isMounted && res.showtimes && res.showtimes.length > 0) {
          setShowtimes(res.showtimes);

          // Select first showtime by default if not set
          if (!selectedShowtime || !res.showtimes.some((s) => s.id === selectedShowtime.id)) {
            const first = res.showtimes[0];
            setSelectedShowtime(first);
            const timeStr = new Date(first.start_time).toLocaleTimeString("es-EC", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
            setSelectedTime(timeStr);
          }
        } else {
          // If no specific showtimes returned, try fetching full movie detail to check embedded showtimes
          const detail = await catalogApi.getMovieById(selectedMovie.id);
          if (isMounted && detail.showtimes && detail.showtimes.length > 0) {
            setShowtimes(detail.showtimes);
            if (!selectedShowtime) {
              const first = detail.showtimes[0];
              setSelectedShowtime(first);
              const timeStr = new Date(first.start_time).toLocaleTimeString("es-EC", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              setSelectedTime(timeStr);
            }
          } else if (isMounted) {
            setShowtimes([]);
          }
        }
      } catch (e) {
        console.warn("No se pudieron cargar funciones de la API, usando mock:", e);
        if (isMounted) setShowtimes([]);
      } finally {
        if (isMounted) setIsLoadingShowtimes(false);
      }
    };

    loadShowtimes();

    return () => {
      isMounted = false;
    };
  }, [selectedMovie.id, selectedCinemaId, setSelectedShowtime, setSelectedTime]);

  // Derive dynamic dates from backend showtimes if available
  const availableDates = useMemo<DateOption[]>(() => {
    if (showtimes.length === 0) return DATES;

    const map = new Map<string, DateOption>();
    showtimes.forEach((st) => {
      const d = new Date(st.start_time);
      const isoDate = d.toISOString().split("T")[0];
      if (!map.has(isoDate)) {
        const dayName = d.toLocaleDateString("es-EC", { weekday: "short" }).replace(".", "");
        const dayNumber = d.getDate().toString();
        const month = d.toLocaleDateString("es-EC", { month: "short" }).replace(".", "");
        const formatted = d.toLocaleDateString("es-EC", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

        map.set(isoDate, {
          id: isoDate,
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          dayNumber,
          month: month.charAt(0).toUpperCase() + month.slice(1),
          formatted,
        });
      }
    });

    return Array.from(map.values());
  }, [showtimes]);

  // Filter showtimes matching current selected date
  const filteredShowtimes = useMemo(() => {
    if (showtimes.length === 0) return [];
    return showtimes.filter((st) => {
      const d = new Date(st.start_time).toISOString().split("T")[0];
      return d === selectedDate.id;
    });
  }, [showtimes, selectedDate.id]);

  const handleSelectShowtime = (st: CatalogShowtimeDto) => {
    setSelectedShowtime(st);
    const timeStr = new Date(st.start_time).toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    setSelectedTime(timeStr);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Step Header Badge */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-[#C7AA78] text-[#1c1d21] font-extrabold text-sm flex items-center justify-center shadow-md shadow-[#C7AA78]/20">
            2
          </span>
          <h2 className="text-lg font-bold text-[#FFFFFF] tracking-tight">
            Seleccionar función
          </h2>
        </div>

        <button
          type="button"
          onClick={() => navigate("/peliculas")}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#F2F0EB]/70 hover:text-[#C7AA78] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cambiar película</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-[#1b1c20] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-7">
        {/* Movie Summary Header */}
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <img
            src={selectedMovie.poster}
            alt={selectedMovie.title}
            className="w-28 sm:w-32 aspect-[3/3.5] rounded-2xl object-cover border border-white/10 shadow-lg shrink-0"
          />
          <div className="space-y-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {selectedMovie.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#F2F0EB]/65 font-medium">
              {selectedMovie.genre} &bull; {selectedMovie.duration} &bull;{" "}
              {selectedMovie.ageRating}
            </p>
            <p className="text-sm text-[#F2F0EB]/75 leading-relaxed pt-1">
              {selectedMovie.synopsis}
            </p>
          </div>
        </div>

        {/* 1. Selecciona el cine */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <MapPin className="w-4 h-4 text-[#C7AA78]" />
            <span>Selecciona el cine</span>
          </div>

          <div className="relative">
            <select
              value={selectedCinemaId ? String(selectedCinemaId) : selectedCinema}
              onChange={(e) => {
                const val = e.target.value;
                const found = cinemas.find((c) => String(c.id) === val);
                if (found) {
                  setSelectedCinemaId(found.id);
                  setSelectedCinema(found.name);
                } else {
                  setSelectedCinema(val);
                  setSelectedCinemaId(undefined);
                }
              }}
              className="w-full appearance-none px-4 py-3.5 pr-10 rounded-xl bg-[#222429] border border-white/10 text-sm text-[#F2F0EB] font-medium focus:outline-none focus:border-[#C7AA78] transition-colors cursor-pointer"
            >
              {cinemas.length > 0
                ? cinemas.map((cinema) => (
                    <option
                      key={cinema.id}
                      value={cinema.id}
                      className="bg-[#202124] text-[#F2F0EB]"
                    >
                      {cinema.name} ({cinema.city})
                    </option>
                  ))
                : CINEMAS.map((cinema) => (
                    <option
                      key={cinema}
                      value={cinema}
                      className="bg-[#202124] text-[#F2F0EB]"
                    >
                      {cinema}
                    </option>
                  ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#F2F0EB]/60 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. Selecciona la fecha */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Calendar className="w-4 h-4 text-[#C7AA78]" />
            <span>Selecciona la fecha</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {availableDates.map((date) => {
              const isSelected = selectedDate.id === date.id;
              return (
                <button
                  key={date.id}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#C7AA78]/15 border-[#C7AA78] text-white shadow-lg shadow-[#C7AA78]/10"
                      : "bg-[#222429] border-white/10 text-[#F2F0EB]/75 hover:border-white/25 hover:bg-[#282a30]"
                  }`}
                >
                  <span className="text-xs font-medium opacity-80">
                    {date.dayName}
                  </span>
                  <span className="text-xl font-extrabold text-white my-0.5">
                    {date.dayNumber}
                  </span>
                  <span className="text-xs font-medium opacity-75">
                    {date.month}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Horarios disponibles (Funciones de la API o Fallback) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Clock className="w-4 h-4 text-[#C7AA78]" />
              <span>Funciones y horarios disponibles</span>
            </div>
            {isLoadingShowtimes && (
              <span className="flex items-center gap-1.5 text-xs text-[#C7AA78]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Cargando...
              </span>
            )}
          </div>

          {filteredShowtimes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredShowtimes.map((st) => {
                const timeStr = new Date(st.start_time).toLocaleTimeString("es-EC", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                const isSelected = selectedShowtime?.id === st.id;

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectShowtime(st)}
                    className={`py-3 px-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#C7AA78]/15 border-[#C7AA78] text-white shadow-md shadow-[#C7AA78]/10"
                        : "bg-[#222429] border-white/10 text-[#F2F0EB]/80 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-base text-white">
                        <span>{timeStr}</span>
                        <span className="px-2 py-0.5 rounded bg-[#C7AA78]/20 text-[#C7AA78] text-[10px] uppercase font-extrabold">
                          {st.format}
                        </span>
                      </div>
                      <p className="text-xs text-[#F2F0EB]/60 mt-0.5 flex items-center gap-1">
                        <Film className="w-3 h-3 text-[#C7AA78]" />
                        {st.auditorium?.name || "Sala Principal"}
                      </p>
                    </div>

                    {st.ticket_types && st.ticket_types.length > 0 && (
                      <span className="text-xs font-semibold text-[#C7AA78]">
                        Desde ${Number(st.ticket_types[0].price).toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SHOWTIMES.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#C7AA78]/15 border-[#C7AA78] text-white shadow-md shadow-[#C7AA78]/10"
                        : "bg-[#222429] border-white/10 text-[#F2F0EB]/80 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Cantidad y Tipo de Boletos (Precios dinámicos de la API) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Ticket className="w-4 h-4 text-[#C7AA78]" />
              <span>Cantidad de boletos</span>
            </div>
            <span className="text-xs font-semibold text-[#C7AA78]">
              {totalTickets} {totalTickets === 1 ? "boleto" : "boletos"} &bull;{" "}
              ${totalPrice.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#222429] border border-white/10 rounded-2xl divide-y divide-white/10">
            {/* Adult Ticket Row */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">Tarifa General / Adulto</p>
                <p className="text-xs text-[#F2F0EB]/60">
                  Tarifa regular &bull; ${ticketPrice.toFixed(2)} c/u
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#1b1c20] border border-white/15 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAdultTickets(adultTickets - 1)}
                    disabled={adultTickets <= 0}
                    className="p-2.5 text-[#F2F0EB]/75 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-extrabold text-white">
                    {adultTickets}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdultTickets(adultTickets + 1)}
                    className="p-2.5 text-[#F2F0EB]/75 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Discounted Ticket Row: Niño / 3ra Edad / Discapacidad */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white">
                    Niño / 3ra Edad / Discapacidad
                  </p>
                  <span className="px-2 py-0.5 rounded-full bg-[#C7AA78]/20 border border-[#C7AA78]/40 text-[#C7AA78] text-[10px] font-extrabold uppercase tracking-wider">
                    50% DTO.
                  </span>
                </div>
                <p className="text-xs text-[#F2F0EB]/60 mt-0.5">
                  Tarifa preferencial &bull; ${discountTicketPrice.toFixed(2)} c/u
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#1b1c20] border border-white/15 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDiscountTickets(discountTickets - 1)}
                    disabled={discountTickets <= 0}
                    className="p-2.5 text-[#F2F0EB]/75 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-extrabold text-white">
                    {discountTickets}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDiscountTickets(discountTickets + 1)}
                    className="p-2.5 text-[#F2F0EB]/75 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {totalTickets === 0 && (
            <p className="text-xs text-amber-400">
              Selecciona al menos 1 boleto para continuar a la elección de
              asientos.
            </p>
          )}
        </div>

        {/* CTA Button */}
        <button
          type="button"
          disabled={totalTickets === 0}
          onClick={() => navigate("/asientos")}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#C7AA78] hover:bg-[#d5bd92] disabled:opacity-40 disabled:cursor-not-allowed text-[#1c1d21] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C7AA78]/20 transition-all cursor-pointer"
        >
          <span>Continuar ({totalTickets} {totalTickets === 1 ? "asiento" : "asientos"})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
