import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  CreditCard,
  Armchair,
  Ticket,
  Lock,
  User,
  ArrowLeft,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { bookingApi } from "../api/booking";

export const CheckoutPayment: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedMovie,
    selectedCinema,
    selectedDate,
    selectedTime,
    selectedShowtime,
    selectedSeats,
    adultTickets,
    discountTickets,
    totalTickets,
    totalPrice,
    ticketPrice,
    discountTicketPrice,
    currentReservation,
    setCurrentReservation,
  } = useBooking();

  const [cardNumber, setCardNumber] = useState("1234 5678 9012 3456");
  const [expiry, setExpiry] = useState("10 / 28");
  const [cvv, setCvv] = useState("123");
  const [fullName, setFullName] = useState("Juan Pérez");

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 10-minute Redis lock countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (currentReservation?.expires_at) {
      const diff = Math.floor(
        (new Date(currentReservation.expires_at).getTime() - Date.now()) / 1000,
      );
      return Math.max(0, diff);
    }
    return currentReservation?.remaining_lock_seconds || 600;
  });

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  if (totalTickets === 0) {
    return <Navigate to="/funcion" replace />;
  }
  if (selectedSeats.length < totalTickets) {
    return <Navigate to="/asientos" replace />;
  }

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (secondsRemaining <= 0) {
      setErrorMsg("El tiempo de bloqueo de 10 minutos para estos asientos ha expirado. Por favor, vuelve a seleccionarlos.");
      return;
    }

    // If reservation exists in booking-service, confirm payment
    if (currentReservation?.booking_code) {
      setIsProcessing(true);
      setErrorMsg(null);
      try {
        const cleanCard = cardNumber.replace(/\s+/g, "");
        const confirmed = await bookingApi.confirmReservation(
          currentReservation.booking_code,
          {
            payment_method: "card",
            card_holder: fullName,
            card_last_four: cleanCard.slice(-4),
            payment_reference: `PAY-${Date.now().toString(36).toUpperCase()}`,
          },
        );

        setCurrentReservation(confirmed);
        navigate("/confirmacion");
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "No se pudo procesar el pago. Por favor, verifica los datos e intenta nuevamente.";
        setErrorMsg(msg);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Mock flow fallback
      navigate("/confirmacion");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Step Header Badge */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-[#C7AA78] text-[#1c1d21] font-extrabold text-sm flex items-center justify-center shadow-md shadow-[#C7AA78]/20">
            4
          </span>
          <h2 className="text-lg font-bold text-[#FFFFFF] tracking-tight">
            Pago y resumen
          </h2>
        </div>

        <button
          type="button"
          onClick={() => navigate("/asientos")}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#F2F0EB]/70 hover:text-[#C7AA78] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a asientos</span>
        </button>
      </div>

      {/* Redis Lock Timer Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-[#222429] border border-[#C7AA78]/35 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C7AA78]/15 border border-[#C7AA78]/30 flex items-center justify-center text-[#C7AA78]">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Tus asientos están bloqueados temporalmente en Redis
            </h4>
            <p className="text-xs text-[#F2F0EB]/65">
              Completa tu compra antes de que expire el tiempo para garantizar tu lugar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1b1c20] border border-white/10">
          <span className="text-xs text-[#F2F0EB]/70 font-medium">Tiempo restante:</span>
          <span
            className={`font-mono text-base font-extrabold ${
              secondsRemaining < 120 ? "text-red-400 animate-pulse" : "text-[#C7AA78]"
            }`}
          >
            {formatCountdown(secondsRemaining)}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          {secondsRemaining <= 0 && (
            <button
              type="button"
              onClick={() => navigate("/asientos")}
              className="px-3 py-1 rounded-lg bg-red-500/20 text-white text-xs font-bold hover:bg-red-500/30"
            >
              Volver a asientos
            </button>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="bg-[#1b1c20] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Booking Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ClipboardList className="w-4 h-4 text-[#C7AA78]" />
              <span>Resumen de tu reserva</span>
            </div>

            <div className="bg-[#222429] border border-white/10 rounded-2xl p-5 space-y-5">
              {/* Movie info */}
              <div className="flex items-center gap-4 pb-5 border-b border-white/10">
                <img
                  src={selectedMovie.poster}
                  alt={selectedMovie.title}
                  className="w-20 h-24 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">
                    {selectedMovie.title}
                  </h3>
                  <p className="text-xs text-[#F2F0EB]/65">
                    {selectedCinema} &bull; {selectedDate.formatted} &bull; {selectedTime}
                  </p>
                  <p className="text-xs text-[#C7AA78]">
                    {selectedShowtime?.auditorium?.name || selectedMovie.room || "Sala Principal"}
                  </p>
                  {currentReservation?.booking_code && (
                    <p className="text-[11px] font-mono text-[#F2F0EB]/50 pt-0.5">
                      Reserva: {currentReservation.booking_code}
                    </p>
                  )}
                </div>
              </div>

              {/* Seats */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-[#F2F0EB]/75">
                  <Armchair className="w-4 h-4 text-[#C7AA78]" />
                  <span>Asientos</span>
                </div>
                <span className="font-bold text-white">
                  {selectedSeats.join(", ")}
                </span>
              </div>

              {/* Read-Only Ticket Breakdown */}
              <div className="pb-4 border-b border-white/10 space-y-3 text-xs sm:text-sm">
                {adultTickets > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-[#F2F0EB]/75">
                      <Ticket className="w-4 h-4 text-[#C7AA78]" />
                      <span>Entradas (Tarifa General)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-[#1b1c20] border border-white/10 text-xs font-bold text-[#F2F0EB]/90">
                        x{adultTickets}
                      </span>
                      <span className="font-bold text-white">
                        ${(adultTickets * ticketPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {discountTickets > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-[#F2F0EB]/75">
                      <Ticket className="w-4 h-4 text-[#C7AA78]" />
                      <span>Niño / 3ra Edad (50%)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-[#1b1c20] border border-white/10 text-xs font-bold text-[#F2F0EB]/90">
                        x{discountTickets}
                      </span>
                      <span className="font-bold text-white">
                        ${(discountTickets * discountTicketPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-lg font-bold text-white">Total</span>
                <span className="text-2xl font-extrabold text-[#C7AA78]">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Method Form */}
          <div className="lg:col-span-7 lg:pl-8 lg:border-l lg:border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <CreditCard className="w-4 h-4 text-[#C7AA78]" />
              <span>Método de pago</span>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              {/* Radio Card Option */}
              <div className="bg-[#222429] border border-white/15 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full border-2 border-[#C7AA78] flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#C7AA78]" />
                  </span>
                  <CreditCard className="w-4 h-4 text-[#F2F0EB]/80" />
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    Tarjeta de crédito / débito
                  </span>
                </div>

                {/* Card Brand Badges */}
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#1A1F71] text-white font-extrabold italic text-[10px] tracking-wider">
                    VISA
                  </span>
                  <div className="flex items-center -space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#EB001B] inline-block opacity-90" />
                    <span className="w-4 h-4 rounded-full bg-[#F79E1B] inline-block opacity-90" />
                  </div>
                  <div className="flex items-center -space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0066B2] inline-block opacity-90" />
                    <span className="w-4 h-4 rounded-full bg-[#EB001B] inline-block opacity-90" />
                  </div>
                </div>
              </div>

              {/* Card Number */}
              <div className="space-y-1.5">
                <label className="block text-xs text-[#F2F0EB]/70 font-medium">
                  Número de tarjeta
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-[#222429] border border-white/10 text-sm text-white placeholder-[#777777] focus:outline-none focus:border-[#C7AA78] transition-colors"
                  />
                  <CreditCard className="w-4 h-4 text-[#F2F0EB]/50 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F2F0EB]/70 font-medium">
                    Fecha de expiración
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM / AA"
                    className="w-full px-4 py-3 rounded-xl bg-[#222429] border border-white/10 text-sm text-white placeholder-[#777777] focus:outline-none focus:border-[#C7AA78] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F2F0EB]/70 font-medium">
                    CVV
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-[#222429] border border-white/10 text-sm text-white placeholder-[#777777] focus:outline-none focus:border-[#C7AA78] transition-colors"
                    />
                    <Lock className="w-4 h-4 text-[#F2F0EB]/50 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <User className="w-3.5 h-3.5 text-[#C7AA78]" />
                  <span>Datos de facturación</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F2F0EB]/70 font-medium">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-3 rounded-xl bg-[#222429] border border-white/10 text-sm text-white placeholder-[#777777] focus:outline-none focus:border-[#C7AA78] transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || secondsRemaining <= 0}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] disabled:opacity-40 disabled:cursor-not-allowed text-[#1c1d21] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C7AA78]/20 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirmando pago y generando QR...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pagar y confirmar reserva</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
