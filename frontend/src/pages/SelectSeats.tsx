import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import {
  DISCOUNT_TICKET_PRICE,
  OCCUPIED_SEATS,
  SEAT_ROWS,
  SEATS_PER_ROW,
  TICKET_PRICE,
} from "../data/mockCinema";
import { useBooking } from "../context/BookingContext";

export const SelectSeats: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedMovie,
    selectedDate,
    selectedTime,
    adultTickets,
    discountTickets,
    totalTickets,
    selectedSeats,
    toggleSeat,
    totalPrice,
  } = useBooking();

  const remainingSeats = Math.max(0, totalTickets - selectedSeats.length);
  const canContinue =
    totalTickets > 0 && selectedSeats.length === totalTickets;

  // Enforce sequential flow: must choose at least 1 ticket in Step 2 first
  if (totalTickets === 0) {
    return <Navigate to="/funcion" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Step Header Badge */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-[#C7AA78] text-[#1c1d21] font-extrabold text-sm flex items-center justify-center shadow-md shadow-[#C7AA78]/20">
            3
          </span>
          <h2 className="text-lg font-bold text-[#FFFFFF] tracking-tight">
            Elegir asientos
          </h2>
        </div>

        <button
          type="button"
          onClick={() => navigate("/funcion")}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#F2F0EB]/70 hover:text-[#C7AA78] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a función</span>
        </button>
      </div>

      {/* Main Screen Card */}
      <div className="bg-[#1b1c20] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Seat Map */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {selectedMovie.room || "Sala 1"}
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#222429] border border-[#C7AA78]/40 text-xs font-bold text-[#C7AA78]">
                  Elegidos: {selectedSeats.length} / {totalTickets}
                </span>
              </div>

              {/* Cinema Screen Indicator ("PANTALLA") */}
              <div className="max-w-md mb-7 pl-9">
                <div className="relative flex flex-col items-center">
                  {/* Glowing curved screen bar */}
                  <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-transparent via-[#C7AA78] to-transparent shadow-[0_6px_20px_rgba(199,170,120,0.45)]" />
                  <div className="w-4/5 h-3 bg-gradient-to-b from-[#C7AA78]/15 to-transparent rounded-b-full blur-[2px]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#C7AA78]/80 mt-1">
                    Pantalla
                  </span>
                </div>
              </div>

              {/* Seat Rows Matrix */}
              <div className="space-y-3.5 max-w-md">
                {SEAT_ROWS.map((row) => (
                  <div key={row} className="flex items-center gap-4">
                    <span className="w-5 text-sm font-bold text-[#F2F0EB]/80">
                      {row}
                    </span>

                    <div className="grid grid-cols-8 gap-2.5 flex-1">
                      {Array.from({ length: SEATS_PER_ROW }, (_, idx) => {
                        const seatNumber = idx + 1;
                        const seatId = `${row}${seatNumber}`;
                        const isOccupied = OCCUPIED_SEATS.has(seatId);
                        const isSelected = selectedSeats.includes(seatId);

                        return (
                          <button
                            key={seatId}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => toggleSeat(seatId)}
                            title={
                              isOccupied
                                ? `Asiento ${seatId} (Ocupado)`
                                : `Asiento ${seatId}`
                            }
                            className={`h-8 sm:h-9 rounded-t-lg rounded-b-md transition-all flex items-center justify-center text-[11px] font-bold ${
                              isOccupied
                                ? "bg-[#6e7076] text-transparent cursor-not-allowed opacity-85"
                                : isSelected
                                  ? "bg-[#C7AA78] text-[#1c1d21] shadow-md shadow-[#C7AA78]/30 scale-105 cursor-pointer"
                                  : "bg-[#32343a] border border-white/5 text-transparent hover:border-[#C7AA78]/60 hover:bg-[#3c3f46] cursor-pointer"
                            }`}
                          >
                            {seatId}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seat Legend */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-[#F2F0EB]/75 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-[#32343a] border border-white/15 inline-block" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-[#C7AA78] inline-block" />
                <span>Seleccionado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-[#6e7076] inline-block" />
                <span>Ocupado</span>
              </div>
            </div>
          </div>

          {/* Right: Summary Sidebar Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#222429] border border-white/10 rounded-2xl p-5 sm:p-6 h-full flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                {/* Movie mini info */}
                <div className="flex items-center gap-3.5 pb-5 border-b border-white/10">
                  <img
                    src={selectedMovie.poster}
                    alt={selectedMovie.title}
                    className="w-16 h-20 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">
                      {selectedMovie.title}
                    </h3>
                    <p className="text-xs text-[#F2F0EB]/65">
                      {selectedDate.formatted} &bull; {selectedTime}
                    </p>
                    <p className="text-xs text-[#F2F0EB]/65">
                      {selectedMovie.room || "Sala 1"}
                    </p>
                  </div>
                </div>

                {/* Selected seats row */}
                <div className="pb-4 border-b border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#F2F0EB]/60">Asientos</span>
                    {remainingSeats > 0 && (
                      <span className="text-[11px] font-semibold text-amber-400">
                        Faltan {remainingSeats} por elegir
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-white">
                    <span>
                      {selectedSeats.length > 0
                        ? [...selectedSeats].sort().join(", ")
                        : "Ninguno seleccionado"}
                    </span>
                    <span>
                      {selectedSeats.length} / {totalTickets}
                    </span>
                  </div>
                </div>

                {/* Ticket Breakdown */}
                <div className="pb-4 border-b border-white/10 space-y-2 text-xs text-[#F2F0EB]/75">
                  {adultTickets > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Adulto x{adultTickets}</span>
                      <span className="font-semibold text-white">
                        ${(adultTickets * TICKET_PRICE).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {discountTickets > 0 && (
                    <div className="flex items-center justify-between">
                      <span>
                        Niño / 3ra Edad / Discap. (50%) x{discountTickets}
                      </span>
                      <span className="font-semibold text-white">
                        ${(discountTickets * DISCOUNT_TICKET_PRICE).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium text-[#F2F0EB]/80">
                    Subtotal
                  </span>
                  <span className="text-2xl font-extrabold text-[#C7AA78]">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Continue CTA */}
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => navigate("/pago")}
                className="w-full py-3.5 px-5 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] disabled:opacity-40 disabled:cursor-not-allowed text-[#1c1d21] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C7AA78]/20 transition-all cursor-pointer"
              >
                <span>
                  {canContinue
                    ? "Continuar"
                    : `Elige ${remainingSeats} ${remainingSeats === 1 ? "asiento más" : "asientos más"}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
