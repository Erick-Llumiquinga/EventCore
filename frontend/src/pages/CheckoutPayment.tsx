import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  CreditCard,
  Armchair,
  Ticket,
  Lock,
  User,
  ArrowLeft,
} from "lucide-react";
import { DISCOUNT_TICKET_PRICE, TICKET_PRICE } from "../data/mockCinema";
import { useBooking } from "../context/BookingContext";

export const CheckoutPayment: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedMovie,
    selectedDate,
    selectedTime,
    selectedSeats,
    adultTickets,
    discountTickets,
    totalTickets,
    totalPrice,
  } = useBooking();

  const [cardNumber, setCardNumber] = useState("1234 5678 9012 3456");
  const [expiry, setExpiry] = useState("10 / 28");
  const [cvv, setCvv] = useState("123");
  const [fullName, setFullName] = useState("Juan Pérez");

  if (totalTickets === 0) {
    return <Navigate to="/funcion" replace />;
  }
  if (selectedSeats.length < totalTickets) {
    return <Navigate to="/asientos" replace />;
  }

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/confirmacion");
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
                    {selectedDate.formatted} &bull; {selectedTime}
                  </p>
                  <p className="text-xs text-[#F2F0EB]/65">
                    {selectedMovie.room || "Sala 1"}
                  </p>
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
                      <span>Entradas (Adulto)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-[#1b1c20] border border-white/10 text-xs font-bold text-[#F2F0EB]/90">
                        x{adultTickets}
                      </span>
                      <span className="font-bold text-white">
                        ${(adultTickets * TICKET_PRICE).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {discountTickets > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-[#F2F0EB]/75">
                      <Ticket className="w-4 h-4 text-[#C7AA78]" />
                      <span>Niño / 3ra Edad / Discap. (50%)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-[#1b1c20] border border-white/10 text-xs font-bold text-[#F2F0EB]/90">
                        x{discountTickets}
                      </span>
                      <span className="font-bold text-white">
                        ${(discountTickets * DISCOUNT_TICKET_PRICE).toFixed(2)}
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
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] text-[#1c1d21] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C7AA78]/20 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Pagar y reservar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
