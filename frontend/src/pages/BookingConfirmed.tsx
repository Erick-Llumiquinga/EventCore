import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Check,
  Copy,
  Calendar,
  MapPin,
  Armchair,
  Download,
} from "lucide-react";
import { useBooking } from "../context/BookingContext";

export const BookingConfirmed: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedMovie,
    selectedDate,
    selectedTime,
    selectedSeats,
    totalTickets,
    resetBooking,
    bookingCode,
  } = useBooking();

  const [copied, setCopied] = useState(false);

  if (totalTickets === 0 || selectedSeats.length < totalTickets) {
    return <Navigate to="/peliculas" replace />;
  }

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Step Header Badge */}
      <div className="flex items-center gap-3 mb-5">
        <span className="w-7 h-7 rounded-full bg-[#C7AA78] text-[#1c1d21] font-extrabold text-sm flex items-center justify-center shadow-md shadow-[#C7AA78]/20">
          5
        </span>
        <h2 className="text-lg font-bold text-[#FFFFFF] tracking-tight">
          Reserva confirmada
        </h2>
      </div>

      {/* Main Confirmation Card */}
      <div className="bg-[#1b1c20] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Top subtle radial glow */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-56 h-32 bg-[#C7AA78]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Gold Check Circle */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-full border-2 border-[#C7AA78] bg-[#C7AA78]/10 flex items-center justify-center shadow-lg shadow-[#C7AA78]/20">
            <Check className="w-8 h-8 text-[#C7AA78] stroke-[2.5]" />
          </div>
          {/* Decorative gold particles */}
          <span className="w-1.5 h-1.5 rounded-full bg-[#C7AA78]/60 absolute -top-1 -left-4" />
          <span className="w-1 h-1 rounded-full bg-[#C7AA78]/80 absolute top-2 -right-5" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#C7AA78]/50 absolute -bottom-1 -right-3" />
          <span className="w-1 h-1 rounded-full bg-[#C7AA78]/60 absolute bottom-2 -left-5" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ¡Tus entradas están listas!
        </h1>
        <p className="text-sm text-[#F2F0EB]/65 mt-1.5">
          Gracias por reservar con EventCore
        </p>

        {/* Booking Code Box */}
        <div className="mt-6 w-full max-w-md bg-[#222429] border border-white/15 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4">
          <span className="text-xs sm:text-sm text-[#F2F0EB]/80 font-medium">
            Código de reserva:
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-[#C7AA78] tracking-wider">
            {bookingCode}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            title="Copiar código"
            className="p-1.5 rounded-lg text-[#C7AA78] hover:bg-[#C7AA78]/15 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* QR Code & Movie Ticket Info */}
        <div className="mt-7 w-full max-w-md flex flex-col sm:flex-row items-center justify-center gap-6 sm:divide-x sm:divide-white/15">
          {/* Crisp SVG QR Code */}
          <div className="w-28 h-28 p-2 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 29 29"
              className="w-full h-full text-[#18191c]"
              fill="currentColor"
              shapeRendering="crispEdges"
            >
              {/* Finder Pattern Top-Left */}
              <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z" />
              {/* Finder Pattern Top-Right */}
              <path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z" />
              {/* Finder Pattern Bottom-Left */}
              <path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z" />
              {/* Alignment Pattern */}
              <path d="M20,20 h5 v5 h-5 z M21,21 v3 h3 v-3 z M22,22 h1 v1 h-1 z" />
              {/* Data Modules */}
              <rect x="8" y="0" width="2" height="1" />
              <rect x="11" y="0" width="1" height="2" />
              <rect x="14" y="0" width="3" height="1" />
              <rect x="18" y="1" width="2" height="2" />
              <rect x="9" y="2" width="2" height="2" />
              <rect x="13" y="2" width="2" height="1" />
              <rect x="16" y="3" width="2" height="2" />
              <rect x="8" y="5" width="3" height="1" />
              <rect x="12" y="4" width="3" height="2" />
              <rect x="19" y="5" width="2" height="1" />
              <rect x="0" y="8" width="2" height="2" />
              <rect x="3" y="9" width="3" height="1" />
              <rect x="7" y="8" width="2" height="3" />
              <rect x="11" y="7" width="2" height="2" />
              <rect x="14" y="8" width="3" height="2" />
              <rect x="18" y="7" width="3" height="2" />
              <rect x="22" y="8" width="2" height="2" />
              <rect x="25" y="9" width="3" height="2" />
              <rect x="1" y="11" width="2" height="3" />
              <rect x="4" y="12" width="2" height="2" />
              <rect x="8" y="12" width="3" height="2" />
              <rect x="12" y="11" width="2" height="3" />
              <rect x="15" y="12" width="2" height="2" />
              <rect x="19" y="11" width="2" height="3" />
              <rect x="23" y="12" width="2" height="2" />
              <rect x="27" y="12" width="2" height="3" />
              <rect x="0" y="15" width="3" height="2" />
              <rect x="5" y="15" width="2" height="3" />
              <rect x="9" y="15" width="2" height="2" />
              <rect x="13" y="15" width="3" height="2" />
              <rect x="17" y="15" width="2" height="3" />
              <rect x="21" y="15" width="3" height="2" />
              <rect x="25" y="16" width="2" height="2" />
              <rect x="2" y="18" width="2" height="2" />
              <rect x="6" y="19" width="3" height="2" />
              <rect x="10" y="18" width="3" height="2" />
              <rect x="14" y="19" width="2" height="3" />
              <rect x="18" y="19" width="1" height="2" />
              <rect x="26" y="19" width="3" height="2" />
              <rect x="8" y="22" width="2" height="3" />
              <rect x="11" y="21" width="2" height="2" />
              <rect x="12" y="24" width="3" height="2" />
              <rect x="16" y="23" width="3" height="2" />
              <rect x="8" y="26" width="3" height="2" />
              <rect x="13" y="27" width="2" height="2" />
              <rect x="17" y="26" width="2" height="3" />
              <rect x="21" y="26" width="3" height="2" />
              <rect x="26" y="24" width="3" height="3" />
            </svg>
          </div>

          {/* Movie Info Summary */}
          <div className="sm:pl-6 flex items-center gap-4 text-left">
            <img
              src={selectedMovie.poster}
              alt={selectedMovie.title}
              className="w-16 h-24 rounded-xl object-cover border border-white/10 shrink-0"
            />
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white">
                {selectedMovie.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#F2F0EB]/75">
                <Calendar className="w-3.5 h-3.5 text-[#C7AA78] shrink-0" />
                <span>
                  {selectedDate.formatted} &bull; {selectedTime}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#F2F0EB]/75">
                <MapPin className="w-3.5 h-3.5 text-[#C7AA78] shrink-0" />
                <span>{selectedMovie.room || "Sala 1"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#F2F0EB]/75">
                <Armchair className="w-3.5 h-3.5 text-[#C7AA78] shrink-0" />
                <span>{selectedSeats.join(", ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="mt-8 w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="py-3.5 px-5 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] text-[#1c1d21] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C7AA78]/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar entradas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetBooking();
              navigate("/");
            }}
            className="py-3.5 px-5 rounded-xl bg-transparent hover:bg-white/5 border border-[#C7AA78]/45 text-white font-semibold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

